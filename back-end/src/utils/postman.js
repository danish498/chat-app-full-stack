import postmanCollection from 'postman-collection';

/**
 * Create a Postman collection for the chat app API
 */
export function createChatAppCollection() {
  const collection = {
    info: {
      name: 'Chat App API',
      description: 'API collection for the chat application',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'string'
      },
      {
        key: 'token',
        value: '',
        type: 'string'
      }
    ],
    item: []
  };

  // Auth folder
  const authFolder = {
    name: 'Authentication',
    item: []
  };

  // Register endpoint
  const registerRequest = {
    name: 'Register',
    request: {
      url: '{{baseUrl}}/api/auth/register',
      method: 'POST',
      header: [
        {
          key: 'Content-Type',
          value: 'application/json'
        }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }, null, 2)
      }
    }
  };

  authFolder.item.push(registerRequest);

  // Login endpoint
  const loginRequest = {
    name: 'Login',
    request: {
      url: '{{baseUrl}}/api/auth/login',
      method: 'POST',
      header: [
        {
          key: 'Content-Type',
          value: 'application/json'
        }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }, null, 2)
      },
      script: {
        test: [
          'pm.test("Status code is 200", function () {',
          '    pm.response.to.have.status(200);',
          '});',
          '',
          'pm.test("Response has token", function () {',
          '    const jsonData = pm.response.json();',
          '    pm.expect(jsonData.token).to.exist;',
          '    pm.collectionVariables.set("token", jsonData.token);',
          '});'
        ].join('\n')
      }
    }
  };

  authFolder.item.push(loginRequest);

  // Chat folder
  const chatFolder = {
    name: 'Chat',
    item: []
  };

  // Get chats endpoint
  const getChatsRequest = {
    name: 'Get Chats',
    request: {
      url: '{{baseUrl}}/api/chat',
      method: 'GET',
      header: [
        {
          key: 'Authorization',
          value: 'Bearer {{token}}'
        }
      ]
    }
  };

  chatFolder.item.push(getChatsRequest);

  // Create chat endpoint
  const createChatRequest = {
    name: 'Create Chat',
    request: {
      url: '{{baseUrl}}/api/chat',
      method: 'POST',
      header: [
        {
          key: 'Content-Type',
          value: 'application/json'
        },
        {
          key: 'Authorization',
          value: 'Bearer {{token}}'
        }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          name: 'New Chat',
          participants: ['user2@example.com']
        }, null, 2)
      }
    }
  };

  chatFolder.item.push(createChatRequest);

  // Messages folder
  const messagesFolder = {
    name: 'Messages',
    item: []
  };

  // Get messages endpoint
  const getMessagesRequest = {
    name: 'Get Messages',
    request: {
      url: {
        raw: '{{baseUrl}}/api/messages/:chatId',
        host: ['{{baseUrl}}'],
        path: ['api', 'messages', ':chatId'],
        variable: [
          {
            key: 'chatId',
            value: '1',
            description: 'ID of the chat'
          }
        ]
      },
      method: 'GET',
      header: [
        {
          key: 'Authorization',
          value: 'Bearer {{token}}'
        }
      ]
    }
  };

  messagesFolder.item.push(getMessagesRequest);

  // Send message endpoint
  const sendMessageRequest = {
    name: 'Send Message',
    request: {
      url: {
        raw: '{{baseUrl}}/api/messages/:chatId',
        host: ['{{baseUrl}}'],
        path: ['api', 'messages', ':chatId'],
        variable: [
          {
            key: 'chatId',
            value: '1',
            description: 'ID of the chat'
          }
        ]
      },
      method: 'POST',
      header: [
        {
          key: 'Content-Type',
          value: 'application/json'
        },
        {
          key: 'Authorization',
          value: 'Bearer {{token}}'
        }
      ],
      body: {
        mode: 'raw',
        raw: JSON.stringify({
          content: 'Hello, this is a test message!'
        }, null, 2)
      }
    }
  };

  messagesFolder.item.push(sendMessageRequest);

  // Add folders to collection
  collection.item.push(authFolder);
  collection.item.push(chatFolder);
  collection.item.push(messagesFolder);

  return collection;
}

/**
 * Export collection to JSON file
 */
export function exportCollectionToFile(collection, filename = 'chat-app-collection.json') {
  // Collection is already a plain object, no need for toJSON()
  return JSON.stringify(collection, null, 2);
}

/**
 * Generate and return the complete collection
 */
export function generateCollection() {
  const collection = createChatAppCollection();
  return exportCollectionToFile(collection);
}
