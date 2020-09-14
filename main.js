"use strict";
function parseOut() {
    const inArea = document.getElementById("in");
    if (inArea === null || !(inArea instanceof HTMLTextAreaElement)) {
        alert("Can't find \"in\": HTMLTextAreaElement");
        return;
    }
    const outArea = document.getElementById("out");
    if (outArea === null || !(outArea instanceof HTMLTextAreaElement)) {
        alert("Can't find \"out\": HTMLTextAreaElement");
        return;
    }
    //publish(union(digit, seq("double digit", digit, digit)))(inArea.value)
    //outArea.value = publish(symb("label", char("a"), seq(char("b"), seq(char("c"), char("d")))))(inArea.value)
    //outArea.value = publish(symb("label", seq(char("a"), char("a"))))(inArea.value)
    //outArea.value = publish(union(char("a"), char("b")))(inArea.value)
    outArea.value = publish(symb("test", repeated(char(..."1234567890"))))(inArea.value)
        .map(result => JSON.stringify(result, null, "  "))
        .join("\n\n");
    /*
    outArea.value = JSON.stringify(
        parseUnion(parseDigit, parseSeq("double digit", parseDigit, parseDigit))(startParse(inArea.value)),
        null,
        '  '
    );
    */
    //outArea.value = JSON.stringify(parseSeq("double digit", parseDigit, parseDigit)(startParse(inArea.value)));
    //outArea.value += JSON.stringify(parseDigit(startParse(inArea.value)));
}
