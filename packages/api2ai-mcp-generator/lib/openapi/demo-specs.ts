import { OpenAPISpec } from './types';

/**
 * Petstore API - Classic OpenAPI example
 * A simple pet store with basic CRUD operations
 */
export const petstoreSpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Petstore API',
    version: '1.0.0',
    description: 'A simple pet store API demonstrating basic CRUD operations',
  },
  servers: [
    {
      url: 'https://petstore.swagger.io/v2',
      description: 'Production server',
    },
  ],
  paths: {
    '/pets': {
      get: {
        summary: 'List all pets',
        operationId: 'listPets',
        tags: ['pets'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'How many items to return at one time (max 100)',
            required: false,
            schema: {
              type: 'integer',
              format: 'int32',
            },
          },
        ],
        responses: {
          '200': {
            description: 'A paged array of pets',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Pet',
                  },
                },
              },
            },
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a pet',
        operationId: 'createPets',
        tags: ['pets'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Pet',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pet created',
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/pets/{petId}': {
      get: {
        summary: 'Info for a specific pet',
        operationId: 'showPetById',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'The id of the pet to retrieve',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Expected response to a valid request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Pet',
                },
              },
            },
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete a specific pet',
        operationId: 'deletePet',
        tags: ['pets'],
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'The id of the pet to delete',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '204': {
            description: 'Pet deleted',
          },
          default: {
            description: 'unexpected error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: {
            type: 'integer',
            format: 'int64',
          },
          name: {
            type: 'string',
          },
          tag: {
            type: 'string',
          },
        },
      },
      Error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: {
            type: 'integer',
            format: 'int32',
          },
          message: {
            type: 'string',
          },
        },
      },
    },
  },
};

/**
 * E-commerce API - Comprehensive online store example
 * Demonstrates authentication, complex schemas, and business logic
 */
export const ecommerceSpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'E-commerce API',
    version: '2.0.0',
    description: 'Comprehensive e-commerce platform API with products, orders, and user management',
  },
  servers: [
    {
      url: 'https://api.example-store.com/v2',
      description: 'Production server',
    },
    {
      url: 'https://sandbox-api.example-store.com/v2',
      description: 'Sandbox server',
    },
  ],
  paths: {
    '/products': {
      get: {
        summary: 'List all products',
        operationId: 'listProducts',
        tags: ['products'],
        parameters: [
          {
            name: 'category',
            in: 'query',
            description: 'Filter by category',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: {
              type: 'integer',
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Items per page',
            schema: {
              type: 'integer',
              default: 20,
              maximum: 100,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Product',
                      },
                    },
                    total: {
                      type: 'integer',
                    },
                    page: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new product',
        operationId: 'createProduct',
        tags: ['products'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProductInput',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Product created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Product',
                },
              },
            },
          },
        },
      },
    },
    '/products/{productId}': {
      get: {
        summary: 'Get product details',
        operationId: 'getProduct',
        tags: ['products'],
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Product details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Product',
                },
              },
            },
          },
          '404': {
            description: 'Product not found',
          },
        },
      },
    },
    '/orders': {
      post: {
        summary: 'Create a new order',
        operationId: 'createOrder',
        tags: ['orders'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/OrderInput',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Order',
                },
              },
            },
          },
        },
      },
      get: {
        summary: 'List user orders',
        operationId: 'listOrders',
        tags: ['orders'],
        security: [
          {
            bearerAuth: [],
          },
        ],
        responses: {
          '200': {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Order',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/users/register': {
      post: {
        summary: 'Register a new user',
        operationId: 'registerUser',
        tags: ['users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserRegistration',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
    },
    '/users/login': {
      post: {
        summary: 'User login',
        operationId: 'loginUser',
        tags: ['users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: {
                      type: 'string',
                    },
                    user: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          price: {
            type: 'number',
            format: 'double',
          },
          category: {
            type: 'string',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
          },
          stock: {
            type: 'integer',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      ProductInput: {
        type: 'object',
        required: ['name', 'price', 'category'],
        properties: {
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          price: {
            type: 'number',
            format: 'double',
          },
          category: {
            type: 'string',
          },
          imageUrl: {
            type: 'string',
            format: 'uri',
          },
          stock: {
            type: 'integer',
            default: 0,
          },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          userId: {
            type: 'string',
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem',
            },
          },
          total: {
            type: 'number',
            format: 'double',
          },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          productId: {
            type: 'string',
          },
          quantity: {
            type: 'integer',
          },
          price: {
            type: 'number',
            format: 'double',
          },
        },
      },
      OrderInput: {
        type: 'object',
        required: ['items'],
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: {
                  type: 'string',
                },
                quantity: {
                  type: 'integer',
                },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      UserRegistration: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
          },
          password: {
            type: 'string',
            format: 'password',
            minLength: 8,
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
        },
      },
    },
  },
};

/**
 * Weather API - Simple weather service example
 * Demonstrates external API integration patterns
 */
export const weatherSpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Weather API',
    version: '1.0.0',
    description: 'Get current weather and forecasts for any location',
  },
  servers: [
    {
      url: 'https://api.weather-service.com/v1',
      description: 'Production server',
    },
  ],
  paths: {
    '/weather/current': {
      get: {
        summary: 'Get current weather',
        operationId: 'getCurrentWeather',
        tags: ['weather'],
        parameters: [
          {
            name: 'city',
            in: 'query',
            description: 'City name',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'lat',
            in: 'query',
            description: 'Latitude',
            schema: {
              type: 'number',
            },
          },
          {
            name: 'lon',
            in: 'query',
            description: 'Longitude',
            schema: {
              type: 'number',
            },
          },
          {
            name: 'units',
            in: 'query',
            description: 'Units of measurement',
            schema: {
              type: 'string',
              enum: ['metric', 'imperial'],
              default: 'metric',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Current weather data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CurrentWeather',
                },
              },
            },
          },
        },
      },
    },
    '/weather/forecast': {
      get: {
        summary: 'Get weather forecast',
        operationId: 'getWeatherForecast',
        tags: ['weather'],
        parameters: [
          {
            name: 'city',
            in: 'query',
            description: 'City name',
            schema: {
              type: 'string',
            },
          },
          {
            name: 'days',
            in: 'query',
            description: 'Number of days to forecast',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 14,
              default: 7,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Weather forecast',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/WeatherForecast',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CurrentWeather: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
          },
          temperature: {
            type: 'number',
          },
          feelsLike: {
            type: 'number',
          },
          humidity: {
            type: 'integer',
          },
          pressure: {
            type: 'integer',
          },
          windSpeed: {
            type: 'number',
          },
          description: {
            type: 'string',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      WeatherForecast: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
          },
          forecast: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ForecastDay',
            },
          },
        },
      },
      ForecastDay: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date',
          },
          tempMax: {
            type: 'number',
          },
          tempMin: {
            type: 'number',
          },
          description: {
            type: 'string',
          },
          precipitation: {
            type: 'number',
          },
        },
      },
    },
  },
};

/**
 * User Management API - Complete user lifecycle example
 * Demonstrates authentication, authorization, and CRUD operations
 */
export const userManagementSpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'User Management API',
    version: '1.0.0',
    description: 'Complete user lifecycle management with authentication and authorization',
  },
  servers: [
    {
      url: 'https://api.users.example.com/v1',
      description: 'Production server',
    },
  ],
  paths: {
    '/users': {
      get: {
        summary: 'List all users',
        operationId: 'listUsers',
        tags: ['users'],
        security: [
          {
            apiKey: [],
          },
        ],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: {
              type: 'integer',
              default: 1,
            },
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 20,
            },
          },
        ],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                    total: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new user',
        operationId: 'createUser',
        tags: ['users'],
        security: [
          {
            apiKey: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserInput',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
    },
    '/users/{userId}': {
      get: {
        summary: 'Get user by ID',
        operationId: 'getUserById',
        tags: ['users'],
        security: [
          {
            apiKey: [],
          },
        ],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          '404': {
            description: 'User not found',
          },
        },
      },
      put: {
        summary: 'Update user',
        operationId: 'updateUser',
        tags: ['users'],
        security: [
          {
            apiKey: [],
          },
        ],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserInput',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete user',
        operationId: 'deleteUser',
        tags: ['users'],
        security: [
          {
            apiKey: [],
          },
        ],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '204': {
            description: 'User deleted',
          },
          '404': {
            description: 'User not found',
          },
        },
      },
    },
    '/users/{userId}/roles': {
      get: {
        summary: 'Get user roles',
        operationId: 'getUserRoles',
        tags: ['users', 'roles'],
        security: [
          {
            apiKey: [],
          },
        ],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'User roles',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Role',
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Assign role to user',
        operationId: 'assignUserRole',
        tags: ['users', 'roles'],
        security: [
          {
            apiKey: [],
          },
        ],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  roleId: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Role assigned',
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          username: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
          active: {
            type: 'boolean',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      UserInput: {
        type: 'object',
        required: ['username', 'email', 'firstName', 'lastName'],
        properties: {
          username: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          firstName: {
            type: 'string',
          },
          lastName: {
            type: 'string',
          },
          password: {
            type: 'string',
            format: 'password',
          },
          active: {
            type: 'boolean',
            default: true,
          },
        },
      },
      Role: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          permissions: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
      },
    },
  },
};

/**
 * All available demo specs
 */
export const demoSpecs = {
  petstore: {
    name: 'Petstore API',
    description: 'Classic pet store example with basic CRUD operations',
    spec: petstoreSpec,
  },
  ecommerce: {
    name: 'E-commerce API',
    description: 'Complete online store with products, orders, and authentication',
    spec: ecommerceSpec,
  },
  weather: {
    name: 'Weather API',
    description: 'Weather service with current conditions and forecasts',
    spec: weatherSpec,
  },
  userManagement: {
    name: 'User Management API',
    description: 'User lifecycle management with roles and permissions',
    spec: userManagementSpec,
  },
} as const;

export type DemoSpecKey = keyof typeof demoSpecs;
