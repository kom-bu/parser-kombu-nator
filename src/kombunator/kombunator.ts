export interface parseNode {
    label: string;
    children: parseNode[]
}

export type parseTarget = { string: string; cursorPos: number }
export type parseResult = { newCursorPos: number; syntaxTree: parseNode }
export type parser = (parseTarget: parseTarget) => parseResult[];

export function publish(parser: parser): (string: string) => parseNode[] {
    return (string: string) =>
        parser({string: string, cursorPos: 0})
            .filter(parseResult => string.length === parseResult.newCursorPos)
            .map(parseResult => parseResult.syntaxTree);
}

export function union(...elementParsers: parser[]): parser {
    return ({string: string, cursorPos: cursorPos}) => {
        let parseResults: parseResult[] = [];
        elementParsers.forEach(elementParser => {
            parseResults = parseResults.concat(elementParser({string: string, cursorPos: cursorPos}))
        })
        return parseResults;
    };
}
export function unionSpread(...elementParsersSpread: parserSpread[]): parserSpread {
    return ({string: string, cursorPos: cursorPos}) => {
        let parseResultsSpread: parseResultSpread[] = [];
        elementParsersSpread.forEach(elementParser => {
            parseResultsSpread = parseResultsSpread.concat(elementParser({string: string, cursorPos: cursorPos}))
        })
        return parseResultsSpread;
    };
}

export type parseResultSpread = { newCursorPos: number; syntaxTreeSpread: parseNode[] }
export type parserSpread = (parseTarget: parseTarget) => parseResultSpread[];
export function seq(...elementParsers: (parser | parserSpread)[]): parserSpread { // use as if ...symb (but no label)
    return ({string: string, cursorPos: cursorPos}) => {
        let accumuratedParseResults: { newCursorPos: number; trees: parseNode[] }[] = [{
            newCursorPos: cursorPos,
            trees: []
        }];
        elementParsers.forEach(elementParser => {
            const newAccumuratedParseResults: { newCursorPos: number; trees: parseNode[] }[] = [];
            accumuratedParseResults.forEach(accumuratedParseResult => {
                elementParser({
                    string: string,
                    cursorPos: accumuratedParseResult.newCursorPos
                }).forEach((newParseResult: parseResult | parseResultSpread) => {
                    newAccumuratedParseResults.push({
                        newCursorPos: newParseResult.newCursorPos,
                        trees: accumuratedParseResult.trees
                            .concat("syntaxTree" in newParseResult ? [newParseResult.syntaxTree] : newParseResult.syntaxTreeSpread)
                    });
                });
            });
            accumuratedParseResults = newAccumuratedParseResults;
        });
        return accumuratedParseResults.map(accumuratedParseResult => 
            ({
                newCursorPos: accumuratedParseResult.newCursorPos,
                syntaxTreeSpread: accumuratedParseResult.trees
            })
        );
    };
}
export function seqLazy(...elementParsersPacked: (() => (parser | parserSpread))[]): parserSpread {
    return ({string: string, cursorPos: cursorPos}) => {
        let accumuratedParseResults: { newCursorPos: number; trees: parseNode[] }[] = [{
            newCursorPos: cursorPos,
            trees: []
        }];
        elementParsersPacked.forEach(elementParserPacked => {
            const newAccumuratedParseResults: { newCursorPos: number; trees: parseNode[] }[] = [];
            accumuratedParseResults.forEach(accumuratedParseResult => {
                elementParserPacked()({
                    string: string,
                    cursorPos: accumuratedParseResult.newCursorPos
                }).forEach((newParseResult: parseResult | parseResultSpread) => {
                    newAccumuratedParseResults.push({
                        newCursorPos: newParseResult.newCursorPos,
                        trees: accumuratedParseResult.trees
                            .concat("syntaxTree" in newParseResult ? [newParseResult.syntaxTree] : newParseResult.syntaxTreeSpread)
                    });
                });
            });
            accumuratedParseResults = newAccumuratedParseResults;
        });
        return accumuratedParseResults.map(accumuratedParseResult => 
            ({
                newCursorPos: accumuratedParseResult.newCursorPos,
                syntaxTreeSpread: accumuratedParseResult.trees
            })
        );
    };
}

export function symb(label: string, ...elementParsers: (parser | parserSpread)[]): parser {
    return ({string: string, cursorPos: cursorPos}) => 
        seq(...elementParsers)({string: string, cursorPos: cursorPos})
            .map(parseResultSpread => ({
                newCursorPos: parseResultSpread.newCursorPos,
                syntaxTree: {label: label, children: parseResultSpread.syntaxTreeSpread}
            }));
}

const noop: parser = ({string: string, cursorPos: cursorPos}) =>
        [{ newCursorPos: cursorPos, syntaxTree: { label: '', children: [] } }];

export function maybe(parser: parser): parser{
    return union(noop, parser)
}

export function _char(char: string): parser {
    return ({string: string, cursorPos: cursorPos}) => {
        const nextchar = string[cursorPos];
        if (nextchar === char)
            return [{ newCursorPos: cursorPos + 1, syntaxTree: { label: nextchar, children: [] } }];
        else return [];
    };
}
export function char(...chars: string[]): parser {
    return union(...chars.map(char => _char(char)));
}

export function repeated(parser: parser): parserSpread { //maybe 0 times
    return unionSpread(seq(), seqLazy(() => parser, () => repeated(parser)));
}