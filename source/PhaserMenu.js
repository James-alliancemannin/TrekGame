class PhaserMenu extends Menu
{
    phaserMenuSet(base, increment, count)
    {
        let rval = new Menu();
        let trekgame = this.trekgame;

        for (var i = 1; i <= count; i++)
        {
            let energy = base + (i-1) * increment;
            rval.options.push
            (
                new MenuOption
                (
                    i, ") ", energy + " ENERGY", function()
                    {
                        trekgame.firePhasersEnergy(energy)
                        return true;
                    }
                )
            );
        }

        rval.options.push
        (
            new MenuOption
            (
                "" + (count+1), ") ", "BACK", function(){return true;}
            )
        );

        return rval;
    }

    constructor(trekgame)
    {
        super();

        this.trekgame = trekgame;
        let lowMenu  = this.phaserMenuSet(250, 50, 6);
        let medMenu  = this.phaserMenuSet(500, 100, 6);
        let highMenu = this.phaserMenuSet(1000, 500, 5);

        this.options = 
        [
            new MenuOption("1", ") ", "LOW (250-500)", 
                function()
                {
                    trekgame.showMenu(lowMenu);
                    return false;
                }),
            new MenuOption("2", ") ", "MEDIUM(500-1000)",
            function()
            {
                trekgame.showMenu(medMenu);
                return false;
            }),
            new MenuOption("3", ") ", "HIGH (1000-3000)", 
                function()
                {
                    trekgame.showMenu(highMenu);
                    return false;
                }),
            new MenuOption("4", ") ", "TYPE CUSTOM ENTRY",
                function()
                {
                    trekgame.manualPhaserEntry();
                    return false;
                }),
            new MenuOption("5", ") ", "FOCUSED PHASER STRIKE",
                function()
                {
                    trekgame.showFocusedPhaserTargetMenu();
                    return false;
                }),
            new MenuOption("6", ") ", "BACK", 
                function()
                {
                    return true;
                })
        ];
    }
}

class FocusedPhaserTargetMenu extends Menu
{
    constructor(targetList, trekgame)
    {
        super();

        this.options = [];

        for (var x = 0; x < targetList.length; x++)
        {
            let tgt = targetList[x];

            if (trekgame.enterprise.canSeeEntity(tgt))
            {
                this.options.push
                (
                    new MenuOption
                    (
                        x + 1,
                        ") ",
                        "FOCUSED STRIKE AT SUBSECTOR (" + tgt.subsectorString() + ") - " + tgt.constructor.displayName.toUpperCase(),
                        function()
                        {
                            trekgame.focusedPhaserTargetHandler(tgt);
                            return false;
                        }
                    )
                );
            }
        }

        this.options.push
        (
            new MenuOption
            (
                this.options.length + 1,
                ") ",
                "BACK",
                function(){return true;}
            )
        );
    }
}
