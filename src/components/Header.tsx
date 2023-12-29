import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { AppBar, IconButton, useTheme } from "@mui/material";
import { useContext } from "react";

import ColorModeContext from "@/contexts/colorModeContext";

export default function Header() {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);


  return (
    <AppBar
      color="inherit"
      className=" flex h-16 flex-row items-center justify-between px-10"
    >
      <h1 className=" flex items-center gap-2 text-3xl font-bold">
        
      </h1>

      <div className=" flex h-full items-center gap-4 text-xl font-semibold"></div>

      <IconButton
        onClick={colorMode.toggleColorMode}
        color="inherit"
      >
        {theme.palette.mode === "dark" ? (
          <Brightness7Icon />
        ) : (
          <Brightness4Icon />
        )}
      </IconButton>
    </AppBar>
  );
}
