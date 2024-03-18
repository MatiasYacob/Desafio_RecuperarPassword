import { Command } from "commander";
const program = new Command();

program
    .option('-d','Variable para debug', false)
    .option('-p <port>','Puerto del Servidor', 8080)
    .option('--mode <mode>', 'Mode de trabajo', 'develop')

    .requiredOption('-u <user>', 'Usuario que va a utiliuzar el aplicativo', 'No se ha declarado un usuario.')



program.parse();

console.log("Options:", program.opts());




export default program;