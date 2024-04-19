# postgresql-prisma

The purpose of this article is to showcase how a Prisma project can be set up with production and development databases using a contact list app, and the order of migration or changes to the schema would be done. 

For this project, we will make use of Docker for the creation of both the development and production databases.

## Prerequisites

To follow this project, you would need to have Docker and Node.js installed.

- Instruction for Docker Installation [here](https://www.docker.com/get-started/)
- Instruction for Node.js installation [here](https://nodejs.org/en/download/current)

## Let's Begin

First, we will start by pulling the image that we will be using for our databases.

### Database Setup

```bash
$ docker pull postgres:16.2-alpine3.19
```

#### Expected Output

![alt text](images/docker-pull-postgres.png)

Great, now let's run our containers using the image.

> Note: `POSTGRES_PASSWORD` is the environment variable for the PostgreSQL password and should be replaced with your own password, as well as the `POSTGRES_DB` variable, which is the name of the Database.

#### Production Database

We will be using port **9000** to prevent conflicts in case it is in use.

```bash
$ docker run -d --name prod-db -p 9000:5432 -e 'POSTGRES_PASSWORD=MyHidd3nPa$$' -e 'POSTGRES_DB=prod' postgres:16.2-alpine3.19
```

#### Development Database

For Development, we will be using port **9001** as we are already making use of 9000 for our production database.

```bash
$ docker run -d --name dev-db -p 9001:5432 -e 'POSTGRES_PASSWORD=ADeVMoSt3at' -e 'POSTGRES_DB=dev' postgres:16.2-alpine3.19
```

To confirm both databases are up and running, use the following command:

```bash
$ docker container ls
```

#### Expected Output
![alt text](images/docker-containers.png)

### Node Setup

First, let's create the directory where the Node.js application will live.

```bash
$ mkdir my-contact-list
```

Now, we will initialize the repository using the following command:

```bash
$ npm init -y
```

For the sake of simplicity, we won't be using TypeScript in this project.

Now, let's install Prisma.

```bash
$ npm install prisma --save-dev
```

Prisma is installed as a dependency because the package itself isn't used in our code, hence our servers would have no need for it. The tool that will be used in our code directly is the Prisma client, which we will talk about soon, to allow our contact application to perform CRUD operations on our database using Prisma's ORM.

Now, let's initialize our ORM using the following command:

```bash
$ npx prisma init
```

This would generate a `prisma` file, which we can use to define the schema for our database, and also a `.env` file that would contain the `DATABASE_URL` environment variable that Prisma would make use of.

However, we will be using the (`cross-env`, `cross-var`, and `dotenv-cli`) to dynamically change our database URL for migration on development and deployment on production. But for development purposes, the `DATABASE_URL` variable will be set to our Development database URL.

Install the required packages using the following command:

```bash
$ npm install cross-env dotenv-cli cross-var
```

Now, let's modify our `.env` file to contain our dev and production database URLs.

Modify the `.env` file to contain the following variables:

> Note: As we have special symbols in our password, we need to URL-encode it so we can use it in the connection string.

```bash
DEV_DATABASE_URL='postgresql://postgres:ADeVMoSt3at@localhost:9001/dev'
PROD_DATABASE_URL='postgresql://postgres:MyHidd3nPa%24%24@localhost:9000/prod'
DATABASE_URL='postgresql://postgres:ADeVMoSt3at@localhost:9001/dev'
```

Now, let's modify our `package.json` scripts to have the following commands: `migrate` and `deploy`.

```json
"scripts": {
   "test": "echo \"Error: no test specified\" && exit 1",
    "migrate": "cross-env DATABASE_URL=$(dotenv -p DEV_DATABASE_URL) prisma migrate dev",
    "deploy": "cross-env DATABASE_URL=$(dotenv -p PROD_DATABASE_URL) prisma migrate deploy"
  }
```

Let's break down the command:

- `dotenv`: used to load our environment variables from our `.env` file
- `cross-var`: used to read our environment variables using the `%OUR_ENVIRONMENT_VARIABLE%` syntax
- `cross-set`: used to set our environment variables, this is how we dynamically change our `DATABASE_URL` that Prisma makes use of

With the above command, we will be following the proper migration structure for development, using our development database to make migrations using the `prisma migrate dev` command, which will also regenerate our Prisma client.

While the production will make use of the `prisma migrate deploy` command and would typically be run within your CI/CD process. This command will only deploy migrations created when the `migrate` command was called on the development database, so changes to the schema file will be ignored until migrations are made.

Now, let's create a single table to store our contact list information by adding the following code to our `schema.prisma` file:

```prisma
model Contacts {
  id     String @id @default(uuid())
  name   String
  number String
}
```

Now that we have a schema for our contact list, we can migrate the schema to the development database using the following command:

```bash
npm run migrate
```

followed by the deployment command:

```bash
npm run deploy
```

This only works because of the edits we made to the `package.json` file.

With this, you have a setup for production and development databases.

## Express Application

To bring this closer to being a project, let's create a basic Express application for our contact list API and modify the schema file.

First, let's install `@prisma/client`, `dotenv`, and `express` using the following command:

```bash
npm i express @prisma/client dotenv
```

Now, create an `index.js` file in the root directory of the project. You can use the following code to create an API that will allow the addition of contacts to the database:

```js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize express application and
// parse request body as JSON
const app = express();
app.use(express.json({ extended: true }));

// Create a new Prisma client instance
const prisma = new PrismaClient();

/**
 * Create a new contact
 */
app.post('/contacts', async (req, res) => {
    const { name, number } = req.body;
    try {
        const contact = await prisma.Contacts.create({
            data: {
                name,
                number,
            },
        });
        res.json(contact);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});
```

Run the application using the command `node index.js` while in the project root directory.

To test the code, you can use this command:

```bash
curl http://127.0.0.1:3000/contacts -d '{"name": "miguel", "number": "+2348011122233"}' -H 'Content-Type: application/json'
```

To view the data in the database, use the following Prisma command:

```bash
npx prisma studio
```

### View of Tables in Database

![alt text](images/prisma-tables.png)

### View of Data in Table
![alt text](images/prisma-contact-data.png)

If you would want a bit more CRUD functionality for the application, visit my GitHub [here](https://github.com/Toluhunter/postgresql-prisma) and locate the `index.js` file.

> Note: If any changes are made to the `prisma.schema` file, we can use our `npm run migrate` followed by `npm run deploy` to sync our changes with our databases.

## Conclusion

So far, we have set up our development and production databases with Docker, we set up our migration and deployment to dynamically use the appropriate Database URL with `dotenv-cli`, and `cross-env`.

Finally, we created a small Express application to test our database integration.