function checkArgumentsDefinedAndHaveValue(args)
{
    var x;
    for (x in args)
    {
        arg = args[x];
        console.assert(!(typeof arg == "undefined" || arg == null));
    }
}

function padStringToLength(str, len, padWithChar = ' ')
{
    console.assert(str.length <= len);
    console.assert(padWithChar.length == 1);

    checkArgumentsDefinedAndHaveValue(arguments);

    let padLength = len - str.length;
    let pad1 = Math.floor(padLength / 2);
    let pad2 = padLength - pad1;
    let padLeft = Math.max(pad1,pad2);

    let leftPadStr = str.padStart(padLeft + str.length, padWithChar);

    return leftPadStr.padEnd(len, padWithChar);
}


function htmlEscape(str)
{
    return ("" + str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function spanClass(className, text)
{
    return '<span class="' + className + '">' + htmlEscape(text) + '</span>';
}

function mapCssClassForEntity(gameObject)
{
    if (!gameObject || !gameObject.constructor)
    {
        return "map-empty";
    }

    if (gameObject.constructor == Enterprise)
    {
        return "map-enterprise";
    }
    if (gameObject.constructor == Klingon)
    {
        return "map-klingon" + enemyDamageCssClass(gameObject);
    }
    if (gameObject.constructor == Borg)
    {
        return "map-borg" + enemyDamageCssClass(gameObject);
    }
    if (gameObject.constructor == Breen)
    {
        return "map-breen" + enemyDamageCssClass(gameObject);
    }
    if (gameObject.constructor == KlingonBattleStation || gameObject.constructor == KlingonForwardFortress)
    {
        return "map-klingon-installation" + mapDamageCssClass(gameObject);
    }
    if (gameObject.constructor == BreenDampeningArray)
    {
        return "map-breen-installation" + mapDamageCssClass(gameObject);
    }
    if (gameObject.constructor == BorgTranswarpHub)
    {
        return "map-borg-installation" + mapDamageCssClass(gameObject);
    }
    if (gameObject.constructor == StarBase)
    {
        return "map-starbase" + mapDamageCssClass(gameObject);
    }
    if (gameObject.constructor == DefencePlatform)
    {
        return "map-friendly-station" + mapDamageCssClass(gameObject);
    }
    if (gameObject.constructor == Star)
    {
        return "map-star";
    }
    if (gameObject.constructor == Planet)
    {
        return "map-planet";
    }

    return "map-object";
}

function enemyDamageCssClass(gameObject)
{
    let warningLevel = gameObject.constructor == Borg ? 300 : (gameObject.constructor == Breen ? 180 : 150);
    return typeof gameObject.shields == "number" && gameObject.shields <= warningLevel ? " map-damaged" : "";
}

function mapDamageCssClass(gameObject)
{
    let maximum = gameObject.maxIntegrity || gameObject.constructor.StartIntegrity;
    if (typeof gameObject.integrity == "number" && maximum && gameObject.integrity <= maximum * .5)
    {
        return " map-damaged";
    }
    return "";
}

function sectorBackdropToken(sectorX, sectorY, subsectorX, subsectorY)
{
    let hash = ((sectorX + 1) * 97 + (sectorY + 1) * 53 + (subsectorX + 1) * 29 + (subsectorY + 1) * 17) % 47;
    if (hash == 0) return styledMapToken("~", "map-anomaly");
    if (hash == 7 || hash == 19) return styledMapToken("o", "map-asteroid");
    if (hash == 3 || hash == 11 || hash == 31) return styledMapToken(".", "map-backdrop");
    return " ".repeat(subsectorDisplayWidthChars);
}

function sectorTerrainNote(sectorX, sectorY)
{
    let hash = ((sectorX + 1) * 37 + (sectorY + 1) * 61) % 13;
    if (hash == 0) return "ION INTERFERENCE DETECTED";
    if (hash == 4) return "DENSE DEBRIS FIELD";
    if (hash == 8) return "SUBSPACE ANOMALY TRACE";
    return "SPARSE STELLAR BACKDROP";
}

function appendMapIdentifier(current, token, maxLength = 7)
{
    return current.length + token.length <= maxLength ? current + token : current;
}

function styledMapToken(token, className, width = subsectorDisplayWidthChars)
{
    let paddedToken = ("" + token).padStart(width, ' ');
    let leadingSpaces = paddedToken.length - paddedToken.trimStart().length;
    return " ".repeat(leadingSpaces) + spanClass(className, paddedToken.trimStart());
}

function styledStatusToken(token, className)
{
    return spanClass(className, token);
}

function randomInt(min, max)
{
    checkArgumentsDefinedAndHaveValue(arguments);
    return Math.round(Math.random() * (max-min) + min);
}

function randomFloat(min, max)
{
    checkArgumentsDefinedAndHaveValue(arguments);
    return (Math.random() * (max-min) + min);
}

function gameOutputScrollToBottom()
{
    let textarea = document.getElementById("gameOutputBox");
    textarea.scrollTop = textarea.scrollHeight;
}

function gameOutputAppend(str)
{
    let textarea = document.getElementById("gameOutputBox")
    textarea.value += str + '\n';
    textarea.scrollTop = textarea.scrollHeight;
}

function updateMap(mapString = game.currentSector.toString())
{
    document.getElementById("map").innerHTML = mapString;
}

function updateMapHeader(str)
{
    document.getElementById("mapHeaderSector").innerHTML = "<pre>"+str+"</pre>";
}

function updateMapFooter(str)
{
    document.getElementById("statusflags").innerHTML = "<pre>"+str+"</pre>";
}

function autosave(game)
{
    //console.log("autosave func");
    //console.log(JSON.stringify(game));

    if (game && !game.gameOver)
    {
        localStorage.setItem("autosave", JSON.stringify(game));

        let textarea = document.getElementById("gameOutputBox")
        localStorage.setItem("outputText", textarea.value);
    }
    else
    {
        localStorage.setItem("autosave", null);
        localStorage.setItem("outputText", null);
    }
}

function makeCDF(instanceProbabilities)
{
    var rval = [];
    let totalSum = 0.0;

    for (var x in instanceProbabilities)
    {
        totalSum += instanceProbabilities[x];
        rval.push(totalSum);
    }

    for (var x in rval)
    {
        rval[x] /= totalSum;
    }

    // last value should always be exactly 1
    rval[rval.length-1] = 1.0;

    return rval;
}

// generates a random value, between 0 and valueProbabilities.length-1, where each possible value's chance of
// being generated is listed in the corresponding array entry
function randomWithProbabilities(valueProbabilities)
{
    let randomVal = randomFloat(0.0, 1.0);
    let cdf = makeCDF(valueProbabilities);

    //console.log("" + cdf);
    var x;
    for (x in cdf)
    {
        if (randomVal < cdf[x])
        {
            return x;
        }
    }
    return cdf.length-1;
}

function mapFooter(length)
{
    let rval = "";

    for (var x = 0; x < length; x++)
    {
        rval += "=";
        rval += padStringToLength(""+(x+1), 3, '-');
    }

    return rval;
}

function mapHeader(length)
{
    let rval = "";

    for (var x = 0; x < length; x++)
    {
        rval += "=---";
    }

    return rval;
}