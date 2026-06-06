class HostileInstallation extends GameObject
{
    constructor(className, shields, integrity)
    {
        super(className);
        this.shields = shields;
        this.integrity = integrity;
        this.maxShields = shields;
        this.maxIntegrity = integrity;
        this.combatStepCount = 0;
    }

    ensureInstallationFields()
    {
        if (typeof this.shields != "number") this.shields = this.constructor.StartShields;
        if (typeof this.integrity != "number") this.integrity = this.constructor.StartIntegrity;
        if (typeof this.maxShields != "number") this.maxShields = this.constructor.StartShields;
        if (typeof this.maxIntegrity != "number") this.maxIntegrity = this.constructor.StartIntegrity;
        if (typeof this.combatStepCount != "number") this.combatStepCount = 0;
    }

    toString()
    {
        return this.constructor.stringRepresentation;
    }

    enemyDescription(game)
    {
        return this.constructor.displayName.toLowerCase();
    }

    damageInstallation(energy, game, weaponDescription)
    {
        this.ensureInstallationFields();
        let damage = Math.max(0, Math.floor(energy));
        let shieldDamage = Math.min(this.shields, damage);
        this.shields -= shieldDamage;
        damage -= shieldDamage;
        let integrityDamage = Math.min(this.integrity, damage);
        this.integrity -= integrityDamage;

        gameOutputAppend("\n" + weaponDescription + " strikes " + this.enemyDescription(game) + " at subsector " + this.subsectorString() + " for " + (shieldDamage + integrityDamage) + " damage.");
        if (this.integrity <= 0)
        {
            game.destroyInstallation(this);
        }
        else if (game.currentSectorScanned && game.enterprise.canSeeEntity(this))
        {
            gameOutputAppend("Installation shields " + this.shields + ", integrity " + this.integrity + ".");
        }
    }

    onPhaserHit(energy, game)
    {
        this.damageInstallation(energy, game, "Phaser fire");
    }

    onTorpedoHit(game)
    {
        this.damageInstallation(HostileInstallation.TorpedoDamage, game, "Photon torpedo");
    }

    onTorpedoSplashDamage(energy, game)
    {
        this.damageInstallation(energy, game, "Torpedo overload shockwave");
    }

    onTemporalLanceHit(energy, game, shockwave=false)
    {
        this.damageInstallation(energy, game, shockwave ? "Temporal shockwave" : "Chroniton lance");
    }

    fireAtEnterprise(game, minimumDamage, maximumDamage)
    {
        if (game.enterprise.phaseCloakEvadesAttack())
        {
            gameOutputAppend("\n" + this.constructor.displayName + " fire passes through the Enterprise phase shadow.");
            return false;
        }

        let distance = Math.max(1, this.distanceToObject(game.enterprise));
        let damage = Math.max(1, Math.floor(randomInt(minimumDamage, maximumDamage) / Math.sqrt(distance)));
        gameOutputAppend("\nHOSTILE INSTALLATION: " + this.constructor.displayName + " fires from subsector " + this.subsectorString() + " for " + damage + " units.");
        game.enterprise.onPhaserHit(damage, game);
        return true;
    }

    combatStep(game)
    {
        this.ensureInstallationFields();
        this.combatStepCount++;
    }

    static maxInstancesSector()
    {
        return 1;
    }

    static sectorInstanceProbabilities()
    {
        return [.99, .01];
    }
}

class KlingonBattleStation extends HostileInstallation
{
    constructor()
    {
        super(KlingonBattleStation, KlingonBattleStation.StartShields, KlingonBattleStation.StartIntegrity);
    }

    combatStep(game)
    {
        super.combatStep(game);
        if (Math.random() < KlingonBattleStation.AttackChance)
        {
            this.fireAtEnterprise(game, KlingonBattleStation.MinDamage, KlingonBattleStation.MaxDamage);
        }
    }

    static minInstancesGame() { return 3; }
    static maxInstancesGame() { return 6; }
}

class BreenDampeningArray extends HostileInstallation
{
    constructor()
    {
        super(BreenDampeningArray, BreenDampeningArray.StartShields, BreenDampeningArray.StartIntegrity);
    }

    combatStep(game)
    {
        super.combatStep(game);
        if (Math.random() < BreenDampeningArray.AttackChance)
        {
            this.fireAtEnterprise(game, BreenDampeningArray.MinDamage, BreenDampeningArray.MaxDamage);
        }

        if (!game.enterprise.isDestroyed() && Math.random() < BreenDampeningArray.DisruptionChance)
        {
            let targets = [game.enterprise.components.ShortRangeSensors, game.enterprise.components.PhaserControl, game.enterprise.components.PhotonTubes];
            let component = targets[randomInt(0, targets.length - 1)];
            component.disruptTemporarily(BreenDampeningArray.DisruptionTurns);
            if (component == game.enterprise.components.ShortRangeSensors)
            {
                component.generateCorruptGrid();
            }
            gameOutputAppend("\nDAMPENING FIELD: Breen array destabilizes Enterprise " + (component == game.enterprise.components.ShortRangeSensors ? "sensors" : (component == game.enterprise.components.PhaserControl ? "phaser targeting" : "torpedo targeting")) + ".");
        }
    }

    static minInstancesGame() { return 3; }
    static maxInstancesGame() { return 5; }
}

class BorgTranswarpHub extends HostileInstallation
{
    constructor()
    {
        super(BorgTranswarpHub, BorgTranswarpHub.StartShields, BorgTranswarpHub.StartIntegrity);
    }

    combatStep(game)
    {
        super.combatStep(game);

        let shieldsBefore = this.shields;
        this.shields = Math.min(this.maxShields, this.shields + BorgTranswarpHub.ShieldRegeneration);
        if (this.shields > shieldsBefore && game.currentSectorScanned && game.enterprise.canSeeEntity(this))
        {
            gameOutputAppend("\nBORG HUB: Regeneration restores " + (this.shields - shieldsBefore) + " shield units.");
        }

        if (Math.random() < BorgTranswarpHub.AttackChance)
        {
            this.fireAtEnterprise(game, BorgTranswarpHub.MinDamage, BorgTranswarpHub.MaxDamage);
        }

        let borgCount = game.currentSector.countEntitiesOfType(Borg);
        if (Math.random() < BorgTranswarpHub.ReinforcementChance && game.currentSector.emptySquares() > BorgTranswarpHub.ReservedEmptySquares && game.currentSector.countHostileEntities() < BorgTranswarpHub.MaxSectorShips && borgCount < Borg.maxInstancesSector() && (Borg.Instances || 0) < Borg.maxInstancesGame())
        {
            let reinforcement = new Borg();
            game.currentSector.addEntityInFreeSubsector(reinforcement);
            gameOutputAppend("\nBORG TRANSWARP APERTURE: A Borg vessel drops into the sector. Reinforcement signature confirmed.");
        }
    }

    static minInstancesGame() { return 1; }
    static maxInstancesGame() { return 2; }
}

HostileInstallation.TorpedoDamage = 350;

class KlingonForwardFortress extends HostileInstallation
{
    constructor()
    {
        super(KlingonForwardFortress, KlingonForwardFortress.StartShields, KlingonForwardFortress.StartIntegrity);
    }

    combatStep(game)
    {
        super.combatStep(game);
        if (this.combatStepCount % KlingonForwardFortress.ChargeTurns == 0)
        {
            gameOutputAppend("\nKlingon fortress charges a heavy disruptor cannon.");
            this.fireAtEnterprise(game, KlingonForwardFortress.MinDamage, KlingonForwardFortress.MaxDamage);
        }
    }

    static minInstancesGame() { return 1; }
    static maxInstancesGame() { return 1; }
    static sectorInstanceProbabilities() { return [.995, .005]; }
}

KlingonBattleStation.displayName = "Klingon Battle Station";
KlingonBattleStation.stringRepresentation = "{K}";
KlingonBattleStation.StartShields = 750;
KlingonBattleStation.StartIntegrity = 500;
KlingonBattleStation.AttackChance = .35;
KlingonBattleStation.MinDamage = 180;
KlingonBattleStation.MaxDamage = 300;
KlingonBattleStation.weaponProfile = "disruptor cannon";
KlingonBattleStation.scanDescription = "Static Klingon weapons station.";
KlingonBattleStation.InstancesDestroyed = 0;

BreenDampeningArray.displayName = "Breen Dampening Array";
BreenDampeningArray.stringRepresentation = "{R}";
BreenDampeningArray.StartShields = 650;
BreenDampeningArray.StartIntegrity = 550;
BreenDampeningArray.AttackChance = .22;
BreenDampeningArray.MinDamage = 70;
BreenDampeningArray.MaxDamage = 140;
BreenDampeningArray.DisruptionChance = .32;
BreenDampeningArray.DisruptionTurns = 1;
BreenDampeningArray.weaponProfile = "ion dampening pulse";
BreenDampeningArray.scanDescription = "Disrupts sensors and weapon control.";
BreenDampeningArray.InstancesDestroyed = 0;

BorgTranswarpHub.displayName = "Borg Transwarp Hub";
BorgTranswarpHub.stringRepresentation = "[B]";
BorgTranswarpHub.StartShields = 2600;
BorgTranswarpHub.StartIntegrity = 1800;
BorgTranswarpHub.ShieldRegeneration = 45;
BorgTranswarpHub.AttackChance = .24;
BorgTranswarpHub.MinDamage = 110;
BorgTranswarpHub.MaxDamage = 210;
BorgTranswarpHub.ReinforcementChance = .12;
BorgTranswarpHub.ReservedEmptySquares = 8;
BorgTranswarpHub.MaxSectorShips = 5;
BorgTranswarpHub.weaponProfile = "transwarp surge and regeneration";
BorgTranswarpHub.scanDescription = "High-risk reinforcement hub; tactical retreat advised.";
BorgTranswarpHub.InstancesDestroyed = 0;


KlingonForwardFortress.displayName = "Klingon Forward Fortress";
KlingonForwardFortress.stringRepresentation = "{F}";
KlingonForwardFortress.StartShields = 1050;
KlingonForwardFortress.StartIntegrity = 850;
KlingonForwardFortress.ChargeTurns = 3;
KlingonForwardFortress.MinDamage = 260;
KlingonForwardFortress.MaxDamage = 390;
KlingonForwardFortress.weaponProfile = "heavy disruptor cannon (charges 3 turns)";
KlingonForwardFortress.silhouette = "\n /--F--/\n |==K==|\n /--F--/";
KlingonForwardFortress.scanDescription = "Rare fortified command post supporting Klingon routes.";
KlingonForwardFortress.InstancesDestroyed = 0;
