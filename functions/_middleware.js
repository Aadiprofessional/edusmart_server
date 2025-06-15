// Enable Node.js compatibility for all functions
export const onRequest = async (context) => {
  // Set Node.js compatibility flags
  context.env.NODE_ENV = context.env.NODE_ENV || 'production';
  
  // Continue to the next handler
  return context.next();
}; 