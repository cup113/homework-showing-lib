import { readFileSync, writeFileSync } from 'fs';
import { hc_compile, hso_to_html_file } from './hs-core.js';
if (process.argv.length <= 2)
    throw Error("Please input filename in command line.");
const sourceFile = readFileSync(process.argv[2]).toString();
const htmlFile = hso_to_html_file(hc_compile(sourceFile));
writeFileSync(process.argv[2].split(".")[0] + ".html", htmlFile, { encoding: 'utf-8' });
//# sourceMappingURL=hs-cli.mjs.map