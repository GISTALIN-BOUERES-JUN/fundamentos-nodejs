const { request, response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require ("uuid")

const app = express();
app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find( customer => customer.cpf === cpf);

    if(!customer) {
        return response.status(400).json({ error: "Customer not found"});
    }

    request.customer = customer;

    return next();

}

function getBalance (statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount;
        }else {
            return acc - operation.amount;
        }

    },0)

    return balance;
}

app.post("/account", (request,response) => {
    const { cpf, name } = request.body;
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf);
    if (customerAlreadyExists){
        return response.status(400).json({error: "Customer Already exists!"});
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });
    console.log(customers);
    return response.status(201).send();

});

app.get("/statement", verifyIfExistsAccountCPF, (request, response) =>{
   
    const { customer } = request; 
    return response.json(customer.statement);

});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
} );

app.post("/withdraw", verifyIfExistsAccountCPF, (request,response) => {

    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);
    
    if (balance< amount) { 
        return  response.status(400).json({error: "Insufficient funds!"})
    }

    const statementOperation = { 
        amount, 
        created_at: new Date(),
        type: "debit",

    };

    customer.statement.push(statementOperation);

    return response.status(201).send();


})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) =>{
   
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00")
    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(statement);

});

app.listen(3333);




/*

app.get("/courses", (request, response)=>{
    const query = request.query;
    console.log(query);
    return response.json(["Curso 1", "Curso 2", "Curso 3"]);
});

app.post("/courses", (request, response)=>{
    const body = request.body;
    console.log(body);
    return response.json(["Curso 1", "Curso 2", "Curso 3", "Curso 4"]);
});

app.put("/courses/:id", (request, response)=>{
    const params = request.params;
    console.log(params);
    return response.json(["Curso 6", "Curso 2", "Curso 3", "Curso 4"]);
    
});

app.patch("/courses/:id", (request, response)=>{
    return response.json(["Curso 6", "Curso 7", "Curso 3", "Curso 4"]);
});

app.delete("/courses/:id", (request,response) => {
    return response.json(["Curso 6", "Curso 2", "Curso 4"]);
}); 

*/

