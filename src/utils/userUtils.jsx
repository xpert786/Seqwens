export const isNewUser = () => {
  const userStatus = localStorage.getItem("userStatus"); // "new" or "existing"
  return userStatus === "new";
};
