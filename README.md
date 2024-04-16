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

#### Production Database

We will be using port **9000** to prevent conflicts incase it is in use

```bash
$ docker run -d --name prod-db -p 9000:5432 -e 'POSTGRES_PASSWORD=MyHidd3nPa$$' -e 'POSTGRES_DB=prod' postgres:16.2-alpine3.19
```

#### Development Database

For Development we will be using port **9001** as we are already making use of 9000 for our production database

```bash
$ docker run -d --name dev-db -p 9001:5432 -e 'POSTGRES_PASSWORD=ADeVMo$t3at' -e 'POSTGRES_DB=dev' postgres:16.2-alpine3.19
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

The tool that will be used in our code directly is the prisma client to allow our contact application perform CRUD operations on our database using prisma's ORM

Now let's initalize our ORM using the following command

```bash
$ npx prisma init
```

This would generate a prisma file, which we can use to define the schema for our database, and also a __.env__ file that would contain the **DATABASE_URL** environment variable that prisma would make use of

However, we will be using the **cross-env** to dynamically change our database url for migration on development and deployment on production.

Install cross-env using the following command

```bash
$ npm install cross-env
```

now let's modify our package.json scripts to have the following commands migrate and deploy

```json
"scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "migrate": "cross-env DATABASE_URL=postgresql://postgres:ADeVMo$t3at@localhost:9001/dev prisma migrate dev",
    "deploy": "cross-env DATABASE_URL=postgresql://postgres:MyHidd3nPa$$@localhost:9000/prod prisma migrate deploy"
  }
```

With the above command, we will be following the proper migration structure for development database to make use of the **prisma migrate dev** command which will also regenerate our prisma client 

While the production will make use of the **prisma migrate deploy** command and would typically be run within your CI/CD Process

Now let's create a single table to store our contact list information by adding the following code to our schema.prisma file

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

This only works cause of the edit we made to the packege.json file

```bash
$ npm install prisma
```