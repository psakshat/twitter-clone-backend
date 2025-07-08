// export const protectRoute = async (req, res, next) => {
//   if (!req.auth().isAuthenticated) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized - you must be logged in" });
//   }
//   next();
// };
// export const protectRoute = async (req, res, next) => {
//   console.log("req.auth:", req.auth());

//   const auth = req.auth();
//   console.log("🔐 Clerk Auth:", auth);

//   if (!auth || !auth.isAuthenticated) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized - you must be logged in" });
//   }

//   next();
// };
export const protectRoute = async (req, res, next) => {
  try {
    console.log("🔐 Protecting route...");
    console.log("Headers:", req.headers.authorization);

    // Get auth from Clerk middleware - note: it's req.auth, not req.auth()
    const auth = req.auth;
    console.log("Auth object:", auth);

    // Check if user is authenticated
    if (!auth || !auth.userId) {
      console.log("❌ No auth or userId found");
      return res.status(401).json({
        message: "Unauthorized - you must be logged in",
        error: "NO_AUTH",
      });
    }

    console.log("✅ User authenticated:", auth.userId);

    // Add user info to request for use in routes
    req.userId = auth.userId;
    req.user = auth;

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error);
    return res.status(401).json({
      message: "Unauthorized - authentication failed",
      error: "AUTH_ERROR",
    });
  }
};
