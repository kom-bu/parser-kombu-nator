"use strict";
function publish(parser) {
    return (string) => parser({ string: string, cursorPos: 0 })
        .filter(parseResult => string.length === parseResult.newCursorPos)
        .map(parseResult => parseResult.syntaxTree);
}
function union(...elementParsers) {
    return ({ string: string, cursorPos: cursorPos }) => {
        let parseResults = [];
        elementParsers.forEach(elementParser => {
            parseResults = parseResults.concat(elementParser({ string: string, cursorPos: cursorPos }));
        });
        return parseResults;
    };
}
function unionSpread(...elementParsersSpread) {
    return ({ string: string, cursorPos: cursorPos }) => {
        let parseResultsSpread = [];
        elementParsersSpread.forEach(elementParser => {
            parseResultsSpread = parseResultsSpread.concat(elementParser({ string: string, cursorPos: cursorPos }));
        });
        return parseResultsSpread;
    };
}
function seq(...elementParsers) {
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
function seqLazy(...elementParsersPacked) {
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
function symb(label, ...elementParsers) {
    return ({ string: string, cursorPos: cursorPos }) => seq(...elementParsers)({ string: string, cursorPos: cursorPos })
        .map(parseResultSpread => ({
        newCursorPos: parseResultSpread.newCursorPos,
        syntaxTree: { label: label, children: parseResultSpread.syntaxTreeSpread }
    }));
}
const noop = ({ string: string, cursorPos: cursorPos }) => [{ newCursorPos: cursorPos, syntaxTree: { label: '', children: [] } }];
function maybe(parser) {
    return union(noop, parser);
}
function _char(char) {
    return ({ string: string, cursorPos: cursorPos }) => {
        const nextchar = string[cursorPos];
        if (nextchar === char)
            return [{ newCursorPos: cursorPos + 1, syntaxTree: { label: nextchar, children: [] } }];
        else
            return [];
    };
}
function char(...chars) {
    return union(...chars.map(char => _char(char)));
}
function repeated(parser) {
    return unionSpread(seq(), seqLazy(() => parser, () => repeated(parser)));
}
