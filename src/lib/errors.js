const errorMessages = {
  "auth/email-already-in-use": "This email is already registered.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Password is required.",
  "auth/weak-password": "Use a stronger password with at least 6 characters.",
  "functions/unauthenticated": "Please sign in to continue.",
};

export function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong. Please try again.";
  }

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message
      .replace(/^Firebase:\s*/i, "")
      .replace(/\s*\(.*\)\.?$/, "")
      .trim();
  }

  return "Something went wrong. Please try again.";
}
