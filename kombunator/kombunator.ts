interface parseNode {
    label: string;
    children: parseNode[]
}

type parseTarget = { string: string; cursorPos: number }
type parseResult = { newCursorPos: number; syntaxTree: parseNode }
type parser = (parseTarget: parseTarget) => parseResult[];

function publish(parser: parser): (string: string) => parseNode[] {
    return (string: string) =>
        parser({string: string, cursorPos: 0})
            .filter(parseResult => string.length === parseResult.newCursorPos)
            .map(parseResult => parseResult.syntaxTree);
}

function union(...elementParsers: parser[]): parser {
    return ({string: string, cursorPos: cursorPos}) => {
        let parseResults: parseResult[] = [];
        elementParsers.forEach(elementParser => {
            parseResults = parseResults.concat(elementParser({string: string, cursorPos: cursorPos}))
        })
        return parseResults;
    };
}
function unionSpread(...elementParsersSpread: parserSpread[]): parserSpread {
    return ({string: string, cursorPos: cursorPos}) => {
        let parseResultsSpread: parseResultSpread[] = [];
        elementParsersSpread.forEach(elementParser => {
            parseResultsSpread = parseResultsSpread.concat(elementParser({string: string, cursorPos: cursorPos}))
        })
        return parseResultsSpread;
    };
}

type parseResultSpread = { newCursorPos: number; syntaxTreeSpread: parseNode[] }
type parserSpread = (parseTarget: parseTarget) => parseResultSpread[];
function seq(...elementParsers: (parser | parserSpread)[]): parserSpread { // use as if ...symb (but no label)
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
function seqLazy(...elementParsersPacked: (() => (parser | parserSpread))[]): parserSpread {
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

function symb(label: string, ...elementParsers: (parser | parserSpread)[]): parser {
    return ({string: string, cursorPos: cursorPos}) => 
        seq(...elementParsers)({string: string, cursorPos: cursorPos})
            .map(parseResultSpread => ({
                newCursorPos: parseResultSpread.newCursorPos,
                syntaxTree: {label: label, children: parseResultSpread.syntaxTreeSpread}
            }));
}

const noop: parser = ({string: string, cursorPos: cursorPos}) =>
        [{ newCursorPos: cursorPos, syntaxTree: { label: '', children: [] } }];

function maybe(parser: parser): parser{
    return union(noop, parser)
}

function _char(char: string): parser {
    return ({string: string, cursorPos: cursorPos}) => {
        const nextchar = string[cursorPos];
        if (nextchar === char)
            return [{ newCursorPos: cursorPos + 1, syntaxTree: { label: nextchar, children: [] } }];
        else return [];
    };
}
function char(...chars: string[]): parser {
    return union(...chars.map(char => _char(char)));
}

function repeated(parser: parser): parserSpread { //maybe 0 times
    return unionSpread(seq(), seqLazy(() => parser, () => repeated(parser)));
}