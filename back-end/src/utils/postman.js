/**
 * Create a Postman collection for the chat app API
 */
export function createChatAppCollection() {
  const collection = {
    info: {
      name: 'Chat App API',
      description: 'API collection for the chat application. All authenticated endpoints require Bearer token.',
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
      },
      {
        key: 'refreshToken',
        value: '',
        type: 'string'
      },
      {
        key: 'userId',
        value: '',
        type: 'string'
      },
      {
        key: 'chatId',
        value: '',
        type: 'string'
      },
      {
        key: 'messageId',
        value: '',
        type: 'string'
      }
    ],
    item: []
  };

  const authHeader = { key: 'Authorization', value: 'Bearer {{token}}' };
  const jsonHeader = { key: 'Content-Type', value: 'application/json' };

  // Auth folder
  const authFolder = {
    name: 'Authentication',
    item: [
      {
        name: 'Register',
        request: {
          url: '{{baseUrl}}/api/auth/register',
          method: 'POST',
          header: [jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              username: 'testuser',
              email: 'test@example.com',
              password: 'password123',
              displayName: 'Test User',
              avatarUrl: 'https://example.com/avatar.png'
            }, null, 2)
          }
        }
      },
      {
        name: 'Login',
        request: {
          url: '{{baseUrl}}/api/auth/login',
          method: 'POST',
          header: [jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              email: 'test@example.com',
              password: 'password123'
            }, null, 2)
          },
          script: {
            exec: [
              'pm.test("Status code is 200", function () {',
              '    pm.response.to.have.status(200);',
              '});',
              '',
              'pm.test("Response has tokens", function () {',
              '    const jsonData = pm.response.json();',
              '    pm.expect(jsonData.token).to.exist;',
              '    pm.expect(jsonData.refreshToken).to.exist;',
              '    pm.collectionVariables.set("token", jsonData.token);',
              '    pm.collectionVariables.set("refreshToken", jsonData.refreshToken);',
              '});'
            ]
          }
        }
      },
      {
        name: 'Refresh Token',
        request: {
          url: '{{baseUrl}}/api/auth/refresh-token',
          method: 'POST',
          header: [jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              refreshToken: '{{refreshToken}}'
            }, null, 2)
          }
        }
      },
      {
        name: 'Logout',
        request: {
          url: '{{baseUrl}}/api/auth/logout',
          method: 'POST',
          header: [jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              refreshToken: '{{refreshToken}}'
            }, null, 2)
          }
        }
      },
      {
        name: 'Get Profile',
        request: {
          url: '{{baseUrl}}/api/auth/profile',
          method: 'GET',
          header: [authHeader]
        }
      }
    ]
  };

  // Users folder
  const usersFolder = {
    name: 'Users',
    item: [
      {
        name: 'Get All Users',
        request: {
          url: '{{baseUrl}}/api/users',
          method: 'GET',
          header: [authHeader]
        }
      },
      {
        name: 'Search Users',
        request: {
          url: {
            raw: '{{baseUrl}}/api/users/search?query={{query}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'users', 'search'],
            query: [{ key: 'query', value: 'john' }]
          },
          method: 'GET',
          header: [authHeader]
        }
      },
      {
        name: 'Get User by ID',
        request: {
          url: {
            raw: '{{baseUrl}}/api/users/{{userId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'users', '{{userId}}']
          },
          method: 'GET',
          header: [authHeader]
        }
      },
      {
        name: 'Create User',
        request: {
          url: '{{baseUrl}}/api/users',
          method: 'POST',
          header: [authHeader, jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              username: 'newuser',
              email: 'newuser@example.com',
              password: 'password123',
              displayName: 'New User',
              avatarUrl: 'https://example.com/avatar.png'
            }, null, 2)
          }
        }
      },
      {
        name: 'Update User',
        request: {
          url: {
            raw: '{{baseUrl}}/api/users/{{userId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'users', '{{userId}}']
          },
          method: 'PATCH',
          header: [authHeader, jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              displayName: 'Updated Name',
              avatarUrl: 'https://example.com/new-avatar.png'
            }, null, 2)
          }
        }
      },
      {
        name: 'Delete User',
        request: {
          url: {
            raw: '{{baseUrl}}/api/users/{{userId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'users', '{{userId}}']
          },
          method: 'DELETE',
          header: [authHeader]
        }
      }
    ]
  };

  // Chats folder
  const chatsFolder = {
    name: 'Chats',
    item: [
      {
        name: 'Get My Chats',
        request: {
          url: '{{baseUrl}}/api/chats',
          method: 'GET',
          header: [authHeader]
        }
      },
      {
        name: 'Get Chat by ID',
        request: {
          url: {
            raw: '{{baseUrl}}/api/chats/{{chatId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'chats', '{{chatId}}']
          },
          method: 'GET',
          header: [authHeader]
        }
      },
      {
        name: 'Create Chat',
        request: {
          url: '{{baseUrl}}/api/chats',
          method: 'POST',
          header: [authHeader, jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              name: 'New Group Chat',
              participants: ['user2-id'],
              isGroup: true
            }, null, 2)
          }
        }
      },
      {
        name: 'Update Chat',
        request: {
          url: {
            raw: '{{baseUrl}}/api/chats/{{chatId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'chats', '{{chatId}}']
          },
          method: 'PATCH',
          header: [authHeader, jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              name: 'Updated Chat Name'
            }, null, 2)
          }
        }
      },
      {
        name: 'Delete Chat',
        request: {
          url: {
            raw: '{{baseUrl}}/api/chats/{{chatId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'chats', '{{chatId}}']
          },
          method: 'DELETE',
          header: [authHeader]
        }
      },
      {
        name: 'Add Member to Chat',
        request: {
          url: {
            raw: '{{baseUrl}}/api/chats/{{chatId}}/add-member',
            host: ['{{baseUrl}}'],
            path: ['api', 'chats', '{{chatId}}', 'add-member']
          },
          method: 'POST',
          header: [authHeader, jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              userId: 'user-id-to-add'
            }, null, 2)
          }
        }
      },
      {
        name: 'Get Chat Members',
        request: {
          url: {
            raw: '{{baseUrl}}/api/chats/{{chatId}}/members',
            host: ['{{baseUrl}}'],
            path: ['api', 'chats', '{{chatId}}', 'members']
          },
          method: 'GET',
          header: [authHeader]
        }
      }
    ]
  };

  // Messages folder
  const messagesFolder = {
    name: 'Messages',
    item: [
      {
        name: 'Get Messages by Chat',
        request: {
          url: {
            raw: '{{baseUrl}}/api/messages/{{chatId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'messages', '{{chatId}}']
          },
          method: 'GET',
          header: [authHeader]
        }
      },
      {
        name: 'Send Message',
        request: {
          url: '{{baseUrl}}/api/messages',
          method: 'POST',
          header: [authHeader, jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              chatId: '{{chatId}}',
              content: 'Hello, this is a test message!',
              encryptedContent: null
            }, null, 2)
          }
        }
      },
      {
        name: 'Delete Message',
        request: {
          url: {
            raw: '{{baseUrl}}/api/messages/{{messageId}}',
            host: ['{{baseUrl}}'],
            path: ['api', 'messages', '{{messageId}}']
          },
          method: 'DELETE',
          header: [authHeader]
        }
      }
    ]
  };

  // Keys folder
  const keysFolder = {
    name: 'Keys',
    item: [
      {
        name: 'Store Device',
        request: {
          url: '{{baseUrl}}/api/keys/devices',
          method: 'POST',
          header: [authHeader, jsonHeader],
          body: {
            mode: 'raw',
            raw: JSON.stringify({
              deviceId: 'device-123',
              deviceName: 'My Phone',
              publicKey: 'base64-encoded-public-key'
            }, null, 2)
          }
        }
      },
      {
        name: 'Get User Devices',
        request: {
          url: {
            raw: '{{baseUrl}}/api/keys/{{userId}}/devices',
            host: ['{{baseUrl}}'],
            path: ['api', 'keys', '{{userId}}', 'devices']
          },
          method: 'GET',
          header: [authHeader]
        }
      }
    ]
  };

  // Media folder
  const mediaFolder = {
    name: 'Media',
    item: [
      {
        name: 'Upload Image',
        request: {
          url: '{{baseUrl}}/api/media/upload/image',
          method: 'POST',
          header: [authHeader],
          body: {
            mode: 'formdata',
            formdata: [
              {
                key: 'file',
                type: 'file',
                src: '/path/to/image.jpg'
              }
            ]
          }
        }
      },
      {
        name: 'Upload Video',
        request: {
          url: '{{baseUrl}}/api/media/upload/video',
          method: 'POST',
          header: [authHeader],
          body: {
            mode: 'formdata',
            formdata: [
              {
                key: 'file',
                type: 'file',
                src: '/path/to/video.mp4'
              }
            ]
          }
        }
      }
    ]
  };

  // Health check
  const healthFolder = {
    name: 'Health',
    item: [
      {
        name: 'Health Check',
        request: {
          url: '{{baseUrl}}/health',
          method: 'GET'
        }
      }
    ]
  };

  // Add folders to collection
  collection.item.push(authFolder, usersFolder, chatsFolder, messagesFolder, keysFolder, mediaFolder, healthFolder);

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
