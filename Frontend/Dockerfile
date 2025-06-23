# Use Node.js as the base image
# FROM node:23-alpine3.19
FROM node:23-alpine3.19

# Set working directory
WORKDIR /app/

RUN npm install -g npm@10.9.1

# # Copy remaining files
COPY . .

# # Ensure init script is executable
RUN chmod +x ./init.sh

# # Expose port
EXPOSE 5173

# # Set the init script as the entry point
ENTRYPOINT ["/bin/sh", "./init.sh"]

CMD [ "npm", "run", "dev" ]