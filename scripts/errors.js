"use strict";

// errorType info: show to user, error: not show
function formatError(errorType, message, method) {
  if (typeof(message) == "object" && message.errorType) return message;
  return {errorType: errorType, message: message, method: method}
}
