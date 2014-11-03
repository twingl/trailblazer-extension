module.exports = {
  recording: {
    popup: "/src/ui/popup/recording.html",
    browserAction: {
      19: "/src/ui/icons/19-recording.png",
      38: "/src/ui/icons/38-recording.png"
    }
  },
  idle: {
    popup: "/src/ui/popup/idle.html",
    browserAction: {
      19: "/src/ui/icons/19.png",
      38: "/src/ui/icons/38.png"
    }
  },
  notAuthenticated: {
    popup: "/src/ui/popup/not_authenticated.html",
    browserAction: {
      19: "/src/ui/icons/19.png",
      38: "/src/ui/icons/38.png"
    }
  },
  default: {
    popup: "/src/ui/popup/unknown.html",
    browserAction: {
      19: "/src/ui/icons/19-unknown.png",
      38: "/src/ui/icons/38-unknown.png"
    }
  },
  currentTabId: undefined
};