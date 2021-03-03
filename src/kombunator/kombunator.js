export function publish(parser) {
    return (string) => parser({ string: string, cursorPos: 0 })
        .filter(parseResult => string.length === parseResult.newCursorPos)
        .map(parseResult => parseResult.syntaxTree);
}
export function union(...elementParsers) {
    return ({ string: string, cursorPos: cursorPos }) => {
        let parseResults = [];
        elementParsers.forEach(elementParser => {
            parseResults = parseResults.concat(elementParser({ string: string, cursorPos: cursorPos }));
        });
        return parseResults;
    };
}
export function unionSpread(...elementParsersSpread) {
    return ({ string: string, cursorPos: cursorPos }) => {
        let parseResultsSpread = [];
        elementParsersSpread.forEach(elementParser => {
            parseResultsSpread = parseResultsSpread.concat(elementParser({ string: string, cursorPos: cursorPos }));
        });
        return parseResultsSpread;
    };
}
export function seq(...elementParsers) {
    return ({ string: string, cursorPos: cursorPos }) => {
        let accumuratedParseResults = [{
                newCursorPos: cursorPos,
                trees: []
            }];
        elementParsers.forEach(elementParser => {
            const newAccumuratedParseResults = [];
            accumuratedParseResults.forEach(accumuratedParseResult => {
                elementParser({
                    string: string,
                    cursorPos: accumuratedParseResult.newCursorPos
                }).forEach((newParseResult) => {
                    newAccumuratedParseResults.push({
                        newCursorPos: newParseResult.newCursorPos,
                        trees: accumuratedParseResult.trees
                            .concat("syntaxTree" in newParseResult ? [newParseResult.syntaxTree] : newParseResult.syntaxTreeSpread)
                    });
                });
            });
            accumuratedParseResults = newAccumuratedParseResults;
        });
        return accumuratedParseResults.map(accumuratedParseResult => ({
            newCursorPos: accumuratedParseResult.newCursorPos,
            syntaxTreeSpread: accumuratedParseResult.trees
        }));
    };
}
export function seqLazy(...elementParsersPacked) {
    return ({ string: string, cursorPos: cursorPos }) => {
        let accumuratedParseResults = [{
                newCursorPos: cursorPos,
                trees: []
            }];
        elementParsersPacked.forEach(elementParserPacked => {
            const newAccumuratedParseResults = [];
            accumuratedParseResults.forEach(accumuratedParseResult => {
                elementParserPacked()({
                    string: string,
                    cursorPos: accumuratedParseResult.newCursorPos
                }).forEach((newParseResult) => {
                    newAccumuratedParseResults.push({
                        newCursorPos: newParseResult.newCursorPos,
                        trees: accumuratedParseResult.trees
                            .concat("syntaxTree" in newParseResult ? [newParseResult.syntaxTree] : newParseResult.syntaxTreeSpread)
                    });
                });
            });
            accumuratedParseResults = newAccumuratedParseResults;
        });
        return accumuratedParseResults.map(accumuratedParseResult => ({
            newCursorPos: accumuratedParseResult.newCursorPos,
            syntaxTreeSpread: accumuratedParseResult.trees
        }));
    };
}
export function symb(label, ...elementParsers) {
    return ({ string: string, cursorPos: cursorPos }) => seq(...elementParsers)({ string: string, cursorPos: cursorPos })
        .map(parseResultSpread => ({
        newCursorPos: parseResultSpread.newCursorPos,
        syntaxTree: { label: label, children: parseResultSpread.syntaxTreeSpread }
    }));
}
const noop = ({ string: string, cursorPos: cursorPos }) => [{ newCursorPos: cursorPos, syntaxTree: { label: '', children: [] } }];
export function maybe(parser) {
    return union(noop, parser);
}
export function _char(char) {
    return ({ string: string, cursorPos: cursorPos }) => {
        const nextchar = string[cursorPos];
        if (nextchar === char)
            return [{ newCursorPos: cursorPos + 1, syntaxTree: { label: nextchar, children: [] } }];
        else
            return [];
    };
}
export function char(...chars) {
    return union(...chars.map(char => _char(char)));
}
export function repeated(parser) {
    return unionSpread(seq(), seqLazy(() => parser, () => repeated(parser)));
}
