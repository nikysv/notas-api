import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Notas API",
    version: "1.0.0",
    description:
      "Documentacion REST del backend de notas, autenticacion y comparticion por correo.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
  tags: [
    { name: "Health", description: "Verificacion de estado de la API" },
    { name: "Auth", description: "Autenticacion y registro de usuarios" },
    { name: "Notes", description: "Gestion de notas" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Unauthorized" },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "OK" },
          message: { type: "string", example: "API de notas activa" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Juan Perez" },
          email: {
            type: "string",
            format: "email",
            example: "juan@example.com",
          },
          password: { type: "string", example: "123456" },
          role: {
            type: "string",
            enum: ["user", "admin"],
            example: "user",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "juan@example.com",
          },
          password: { type: "string", example: "123456" },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
        },
      },
      RegisterResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "User registered successfully" },
        },
      },
      NoteRequest: {
        type: "object",
        required: ["title", "content"],
        properties: {
          title: { type: "string", example: "Mi nota" },
          content: { type: "string", example: "Contenido de la nota" },
          isPrivate: { type: "boolean", example: false },
          password: { type: "string", nullable: true, example: null },
          imageUrl: {
            type: "string",
            nullable: true,
            example: "/uploads/12345.png",
          },
        },
      },
      NoteResponse: {
        allOf: [
          { $ref: "#/components/schemas/NoteRequest" },
          {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              userId: { type: "string", example: "1" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
              _links: {
                type: "object",
                properties: {
                  self: {
                    type: "string",
                    example: "http://localhost:3000/api/v1/notes/1",
                  },
                  update: { type: "string" },
                  delete: { type: "string" },
                  share: { type: "string" },
                  collection: { type: "string" },
                },
              },
            },
          },
        ],
      },
      NoteCollectionResponse: {
        type: "object",
        properties: {
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/NoteResponse" },
          },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 10 },
              total: { type: "integer", example: 1 },
              totalPages: { type: "integer", example: 1 },
            },
          },
          _links: {
            type: "object",
            properties: {
              self: { type: "string" },
              prev: { type: "string", nullable: true },
              next: { type: "string", nullable: true },
              create: { type: "string" },
            },
          },
        },
      },
      ShareNoteRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "destino@example.com",
          },
        },
      },
      DeleteResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Note deleted successfully" },
        },
      },
      ShareResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Email sent successfully" },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/app.js", "./src/presentation/controllers/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
