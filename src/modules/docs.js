const { OpenApiBuilder } = require("@loopback/openapi-v3");

// Initialize OpenAPI Builder
const openApiBuilder = new OpenApiBuilder()
  .addInfo({
    title: "My Express API",
    version: "1.0.0",
    description: "Automatically generated OpenAPI documentation",
  })
  .addServer({
    url: "http://api.saahild.com",
    description: "inf express json",
  })
  .addContact({
    name: `Neon`,
    url: `https://saahild.com`,
    email: `neon@saahild.com`,
  })
  .addLicense({
    name: `MIT`,
  });

// todo tag each endpoint file

module.exports = openApiBuilder;
