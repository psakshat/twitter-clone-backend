// export const protectRoute = async (req, res, next) => {
//   if (!req.auth().isAuthenticated) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized - you must be logged in" });
//   }
//   next();
// };
export const protectRoute = async (req, res, next) => {
  console.log("req.auth:", req.auth());

  const auth = req.auth();
  console.log("🔐 Clerk Auth:", auth);

  if (!auth || !auth.isAuthenticated) {
    return res
      .status(401)
      .json({ message: "Unauthorized - you must be logged in" });
  }

  next();
};
