"use client";

import {
  Button,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { useCallback, useState } from "react";
import {
  Chain,
  createWalletClient,
  Hex,
  http,
  isAddress,
  parseEther,
  SendTransactionErrorType,
  stringToHex,
  webSocket,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";

import Log from "@/components/Log";
import { ChainKey, inscriptionChains } from "@/config/chains";
import useInterval from "@/hooks/useInterval";
import { handleAddress, handleLog } from "@/utils/helper";

const example =
  'data:,{"p":"prc-520","op":"mint","tick":"lego","amt":"10000"}';

type RadioType = "meToMe" | "manyToOne";

type GasRadio = "all" | "tip";

export default function Home() {
  const [chain, setChain] = useState<Chain>(polygon);
  const [privateKeys, setPrivateKeys] = useState<Hex[]>([]);
  const [radio, setRadio] = useState<RadioType>("manyToOne");
  const [toAddress, setToAddress] = useState<Hex>('0x65cC05Cc14eC98C8F9fF1993f52f882871d765aA');
  const [rpc, setRpc] = useState<string>('');
  const [inscription, setInscription] = useState<string>(example);
  const [gas, setGas] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const [delay, setDelay] = useState<number>(2);
  const [free, setFree] = useState<number>(0.52);
  const [logs, setLogs] = useState<string[]>([]);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [gasRadio, setGasRadio] = useState<GasRadio>("tip");

  const pushLog = useCallback((log: string, state?: string) => {
    setLogs((logs) => [
      handleLog(log, state),
      ...(logs.length >= 1000 ? logs.slice(0, 1000) : logs),
    ]);
  }, []);

  const client = createWalletClient({
    chain,
    transport: rpc && rpc.startsWith("wss") ? webSocket(rpc) : http(rpc),
  });
  const accounts = privateKeys.map((key) => privateKeyToAccount(key));

  useInterval(
    async () => {
      const results = await Promise.allSettled(
        accounts.map((account) => {
          return client.sendTransaction({
            account,
            to: radio === "meToMe" ? account.address : toAddress,
            value: parseEther(free.toString()),
            ...(inscription
              ? {
                  data: stringToHex(inscription),
                }
              : {}),
            ...(gas > 0
              ? gasRadio === "all"
                ? {
                    gasPrice: parseEther(gas.toString(), "gwei"),
                  }
                : {
                    maxPriorityFeePerGas: parseEther(gas.toString(), "gwei"),
                  }
              : {}),
          });
        }),
      );
      results.forEach((result, index) => {
        const address = handleAddress(accounts[index].address);
        if (result.status === "fulfilled") {
          pushLog(`${address} ${result.value}`, "success");
          setSuccessCount((count) => count + 1);
        }
        if (result.status === "rejected") {
          const e = result.reason as SendTransactionErrorType;
          let msg = `${e.name as string}: `;
          if (e.name === "TransactionExecutionError") {
            msg = msg + e.details;
          }
          if (e.name == "Error") {
            msg = msg + e.message;
          }
          pushLog(`${address} ${msg}`, "error");
        }
      });
    },
    running ? delay : null,
  );

  const run = useCallback(() => {

    if (privateKeys.length === 0) {
      pushLog("No private key/没有私钥", "error");
      setRunning(false);
      return;
    }

    if (radio === "manyToOne" && !toAddress) {
      pushLog("No address/没有地址", "error");
      setRunning(false);
      return;
    }

    // if (!inscription) {
    //   setLogs((logs) => [handleLog("没有铭文", "error"), ...logs]);
    //   setRunning(false);
    //   return;
    // }

    setRunning(true);
  }, [privateKeys.length, pushLog, radio, toAddress]);

  return (
    <div className=" flex flex-col gap-4">
      <div className=" flex flex-col gap-2">
        <span>Project / 当前执行项目</span>
        <TextField size="small"
           InputProps={{
            readOnly: true,
          }}
          disabled={running} defaultValue="Legobit"></TextField>
      </div>
      <div className="flex flex-col gap-2">
        <span>Chain / 链:</span>
        <TextField
          select
          defaultValue='polygon'
          size="small"
          disabled={running}
          InputProps={{
            readOnly: true,
          }}
          onChange={(e) => {
            const text = e.target.value as ChainKey;
            setChain(inscriptionChains[text]);
          }}
        >
          {Object.entries(inscriptionChains).map(([key, chain]) => (
            <MenuItem
              key={chain.id}
              value={key}
            >
              {chain.name}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <div className=" flex flex-col gap-2">
        <span>Private Key（Required, one per line） / 私钥（必填，每行一个）:</span>
        <TextField
          multiline
          minRows={2}
          size="small"
          placeholder="Private key, with or without 0x, the program will handle it automatically / 私钥，带不带 0x 都行，程序会自动处理"
          disabled={running}
          onChange={(e) => {
            const text = e.target.value;
            const lines = text.split("\n");
            const keys = lines
              .map((line) => {
                const key = line.trim();
                if (/^[a-fA-F0-9]{64}$/.test(key)) {
                  return `0x${key}`;
                }
                if (/^0x[a-fA-F0-9]{64}$/.test(key)) {
                  return key as Hex;
                }
              })
              .filter((x) => x) as Hex[];
            setPrivateKeys(keys);
          }}
        />
      </div>

     

      <div className=" flex flex-col gap-2">
        <span>Inscription / 铭文:</span>
        <TextField
          size="small"
          disabled={running}
          defaultValue={example}
          InputProps={{
            readOnly: true,
          }}
          onChange={(e) => {
            const text = e.target.value;
            setInscription(text.trim());
          }}
        />
      </div>

      <div className=" flex flex-col gap-2">
        <span>
          RPC (Optional / 选填):
        </span>
        <TextField
          size="small"
          placeholder="RPC"
          disabled={running}
          defaultValue={rpc}
          onChange={(e) => {
            const text = e.target.value;
            setRpc(text);
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span>Interval（Optional, minimum 0 milliseconds） / 每笔交易间隔时间（选填, 最低 0 ms）:</span>
        <TextField
          type="number"
          size="small"
          placeholder="Default 0 milliseconds / 默认 0 ms"
          disabled={running}
          defaultValue={delay}
          onChange={(e) => {
            const num = Number(e.target.value);
            !Number.isNaN(num) && num >= 0 && setDelay(num);
          }}
        />
      </div>
      <div className="flex justify-between">
        <span>To / 目标地址: {toAddress}</span>
        
      </div>
      <div className="flex justify-between">
      <span>Free / 费用: {free}</span>
      </div>

      <Button
        variant="contained"
        color={running ? "error" : "success"}
        onClick={() => {
          if (!running) {
            run();
          } else {
            setRunning(false);
          }
        }}
      >
        {running ? "Running / 运行中" : "Run / 运行"}
      </Button>

      <Log
        title={`Log / 日志（Success / 成功次数 => ${successCount}）:`}
        logs={logs}
        onClear={() => {
          setLogs([]);
        }}
      />
    </div>
  );
}
