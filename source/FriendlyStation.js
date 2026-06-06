class FriendlyStation extends GameObject
{
    constructor(className)
    {
        super(className);
        this.integrity = className.StartIntegrity;
        this.maxIntegrity = className.StartIntegrity;
    }

    ensureStationFields()
    {
        if (typeof this.integrity != "number") this.integrity = this.constructor.StartIntegrity;
        if (typeof this.maxIntegrity != "number") this.maxIntegrity = this.constructor.StartIntegrity;
    }

    toString()
    {
        return this.constructor.stringRepresentation;
    }

    static maxInstancesSector()
    {
        return 1;
    }
}

class DefencePlatform extends FriendlyStation
{
    constructor()
    {
        super(DefencePlatform);
    }

    combatStep(game)
    {
        this.ensureStationFields();
        let hostiles = game.currentSector.getHostileEntities();
        if (!hostiles.length || Math.random() >= DefencePlatform.AttackChance)
        {
            return;
        }

        hostiles.sort(function(a, b){return a.shields - b.shields;});
        let target = hostiles[0];
        let damage = randomInt(DefencePlatform.MinDamage, DefencePlatform.MaxDamage);
        gameOutputAppend("\nDefence platform fires point-defence lasers at " + target.constructor.displayName + " vessel " + target.subsectorString() + " for " + damage + " units.");
        target.onPhaserHit(damage, game);
    }

    static minInstancesGame() { return 2; }
    static maxInstancesGame() { return 4; }
    static sectorInstanceProbabilities() { return [.975, .025]; }
}

DefencePlatform.displayName = "Federation Defence Platform";
DefencePlatform.stringRepresentation = "[P]";
DefencePlatform.StartIntegrity = 220;
DefencePlatform.AttackChance = .45;
DefencePlatform.MinDamage = 50;
DefencePlatform.MaxDamage = 85;
DefencePlatform.weaponProfile = "point-defence lasers";
DefencePlatform.silhouette = "\n  /===/\n [| P |]\n  /===/";
DefencePlatform.supportRole = "anti-ship fire support";
