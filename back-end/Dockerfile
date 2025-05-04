# Use Node base image
FROM node:18

# Create app directory
WORKDIR /src

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Install nodemon globally (optional)
RUN npm install -g nodemon

# Copy your source code
COPY . .

# Expose port
EXPOSE 3000

# Run your app
CMD ["npm", "start"]
