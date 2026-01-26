// TRUE NEGATIVE: Function with large data literal (should NOT be flagged)
// Expected: NO SMELL001 finding

function createConfig() {
  return {
    api: {
      baseUrl: "https://api.example.com",
      endpoints: {
        users: "/users",
        posts: "/posts",
        comments: "/comments",
      },
    },
    features: {
      enableAuth: true,
      enableCache: true,
      enableLogging: true,
    },
    themes: {
      light: {
        primary: "#ffffff",
        secondary: "#000000",
      },
      dark: {
        primary: "#000000",
        secondary: "#ffffff",
      },
    },
    // Large configuration object - should be discounted
    translations: {
      en: {
        welcome: "Welcome",
        goodbye: "Goodbye",
        // ... many more translations
      },
      es: {
        welcome: "Bienvenido",
        goodbye: "Adiós",
      },
    },
  };
}
