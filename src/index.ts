import {
  CommandType,
  CommandTypeCallbackData,
  lineReader,
} from "./cliWrapper/cliReader";

async function main(): Promise<void> {
  lineReader((arg) => {
    const { type, ...args } = arg;

    switch (type) {
      case CommandType.FIRST: {
        const { thing } = args as CommandTypeCallbackData[CommandType.FIRST];
        console.log(`First: ${thing}`);
        break;
      }
      case CommandType.SECOND: {
        const { other } = args as CommandTypeCallbackData[CommandType.SECOND];
        console.log(`Second: ${other}`);
        break;
      }
    }
  });

  // chess engine to use: https://www.npmjs.com/package/js-chess-engine
}

main();
