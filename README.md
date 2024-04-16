# postgresql-prisma

The purpose of this article is to showcase how a prisma project can be setup with production and development databases using a contact list app, and the order of migration or changes to the schema would be done.

For this project we will make use of docker for creation of both the development and production databases.

## Prerequisites

To Follow this project you would need to have docker and nodejs installed

- Instruction for Docker Installation [here](https://www.docker.com/get-started/)

- Instruction for Node.js installation [here](https://nodejs.org/en/download/current)


## Let's begin

First we will start by pulling our image that we will be using for our databases

### Database Setup

```bash
$ docker pull postgres:16.2-alpine3.19
```

#### Expected Output

![alt text](images/docker-pull-postgres.png)

Great, now let's run our containers using the image

> Note: POSTGRES_PASSWORD is the environment variable for the postgres password and should be replaced with your own password as well as the POSTGRES_DB variable which is the name of the Database

#### Production Database

We will be using port **9000** to prevent conflicts incase it is in use

```bash
$ docker run -d --name prod-db -p 9000:5432 -e 'POSTGRES_PASSWORD=MyHidd3nPa$$' -e 'POSTGRES_DB=prod' postgres:16.2-alpine3.19
```

#### Development Database

For Development we will be using port **9001** as we are already making use of 9000 for our production database

```bash
$ docker run -d --name dev-db -p 9001:5432 -e 'POSTGRES_PASSWORD=ADeVMoSt3at' -e 'POSTGRES_DB=dev' postgres:16.2-alpine3.19
```

To confirm both databases are up and running use the following command

```bash
$ docker container ls
```

#### Expected Output
![alt text](images/docker-containers.png)

### Node Setup

First lets create the directory for the node application will live

```bash
$ mkdir my-contact-list
```

Now we will initialize the the repository using the following command

```bash
$ npm init -y
```

For the sake of simplicity, we won't be using typescript in this project

Now let's install prisma

```bash
$ npm install prisma --save-dev
```

Prisma is installed as a dependecy cause the package itself isn't used in our code hence out servers would have no need for it. 

The tool that will be used in our code directly is the prisma client which we will talk about soon, to allow our contact application perform CRUD operations on our database using prisma's ORM

Now let's initalize our ORM using the following command

```bash
$ npx prisma init
```

This would generate a prisma file, which we can use to define the schema for our database, and also a __.env__ file that would contain the **DATABASE_URL** environment variable that prisma would make use of

However, we will be using the (**cross-env**, **cross-var** and **dotenv-cli**) to dynamically change our database url for migration on development and deployment on production. But for development purposes, the **DATABASE_URL** variable will be set to our Development database url

Install packages using the following command

```bash
$ npm install cross-env dotenv-cli cross-var
```

now let's modify our `.env` file to contain our dev and production database url

modify the .env to contain the following variables

> Note As we have special symbols in our password we need to url encode it, so we can use it in the connection string

```bash
DEV_DATABASE_URL='postgresql://postgres:ADeVMoSt3at@localhost:9001/dev'
PROD_DATABASE_URL='postgresql://postgres:MyHidd3nPa%24%24@localhost:9000/prod'
DATABASE_URL='postgresql://postgres:ADeVMoSt3at@localhost:9001/dev'
```

now let's modify our package.json scripts to have the following commands migrate and deploy


```json
"scripts": {
   "test": "echo \"Error: no test specified\" && exit 1",
    "migrate": "dotenv cross-var cross-env DATABASE_URL=%DEV_DATABASE_URL% prisma migrate dev",
    "deploy": "dotenv cross-var cross-env DATABASE_URL=%PROD_DATABASE_URL% prisma migrate deploy"
  }
```

Let's breakdown the command

 - dotenv: used to load our environment variables from our `.env` file
 - cross-var: used to read our environment variables using the `%OUR_ENVIRONMENT_VARIABLE%` Synthax
 - cross-set: used to set our environment variables, this is how we dynamically change our `DATABASE_URL` prisma makes use of


With the above command, we will be following proper migration structure for development, using our development database to make migrations using the **prisma migrate dev** command which will also regenerate our prisma client 

While the production will make use of the **prisma migrate deploy** command and would typically be run within your CI/CD Process, this command will only deploy migrations created when migrate command was called on the development database, so changes to the schema file will be ignored until migrations are made

Now let's create a single table to store our contact list information by adding the following code to our `schema.prisma` file

```prisma
model Contacts {
  id     String @id @default(uuid())
  name   String
  number String
}
```

Now we have a schema for our contact list we can migrate the schema to the develpment database using the following command

```bash
npm run migrate
```
followed by the deployment command

```bash
npm run deploy
```

This only works cause of the edit we made to the packege.json file

with this you have a setup for production and development databases

## Express Application

To bring this closer to being a project let's create a basic express application for our contact list api and modify the schema file

First let's install `@prisma/client`, `dotenv` and `express` using the following command:

```bash
npm i express @prisma/client dotenv
```

now create an `index.js` file in the root directory of the project, you can use the following code to create an api taht will allow addition of contact to the database

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
run the application using the command `node index.js` while in the project root directory


To test the code you can use this command `curl http://127.0.0.1:3000/contacts -d '{"name": "miguel", "number": "+2348011122233"}' -H 'Content-Type: application/json'
`

To view the data in the database use the following prisma command

```bash
npx prisma studio
```

If you would want a bit more CRUD functionality for the application visit my github [here](https://github.com/Toluhunter/postgresql-prisma) and locate the `index.js` file

> Note: If any changes are made to the `prisma.schema` file we can use our `npm run migrate` followed by `npm run deploy` to sync our chnages with our databases

## Conclusion

so far we have setup our development and production databases with docker, we setup our migration and deployment to dynamically use the approprite Database Url with dotenv-cli, cross-var and cross-env.

Finally we created a small express application to test our database integration