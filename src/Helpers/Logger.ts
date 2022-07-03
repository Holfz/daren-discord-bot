/* Dependencies */
import chalk from "chalk";

/* Variable */
const header = 'DAREN';

/* Function */
const getCtx = (ctx: string | null) => {
    return (ctx !== null) ? header + ':' + ctx : header;
};

/* Exports */
export function logInfo(msg: string | null, context = null) {
    let ctx: string = getCtx(context);
    console.log(chalk.blue(`[${ctx}]`) + ' ' + msg);
}

export function logOk(msg: string | null, context = null) {
    let ctx: string = getCtx(context);
    console.log(chalk.green(`[${ctx}]`) + ' ' + msg);
}

export function logWarn(msg: string | null, context = null) {
    let ctx: string = getCtx(context);
    console.log(chalk.yellow(`[${ctx}]`) + ' ' + msg);
}

export function logError(msg: string | null, context = null) {
    let ctx: string = getCtx(context);
    console.log(chalk.red(`[${ctx}]`) + ' ' + msg);
}