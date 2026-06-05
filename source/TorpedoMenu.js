class TorpedoMenu extends Menu
{
    constructor(targetList, trekgame, overloaded=false)
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
                        (overloaded ? "OVERLOAD TARGET AT SUBSECTOR (" : "TARGET AT SUBSECTOR (") + targetList[x].subsectorString() + ")",
                        function()
                        {
                            trekgame.torpedoHandler(tgt, overloaded);
                            return true;
                        }
                    )
                );
            }
            else
            {
                this.options.push
                (
                    new MenuOption
                    (
                        x + 1,
                        ") ",
                        "???????#####?#??#???#??#??????????",
                        function()
                        {
                            gameOutputAppend("\nUnable to lock on to target due to short range sensor damage");
                            return true;
                        }
                    )
                );
            }
        }

        let manualString = "MANUAL TARGETING" 
        if (!trekgame.enterprise.components.PhotonTubes.targetingAvailable())
        {
            manualString += "(CHANCE TO HIT : " + (100 * trekgame.enterprise.components.PhotonTubes.torpedoAccuracy()) + "%)";
        }  
        this.options.push
        (
            new MenuOption
            (
                this.options.length + 1, 
                ") ",
                manualString,
                function()
                {
                    trekgame.manualTorpedoHandler(overloaded);
                }
            )
        );

        this.options.push
        (
            new MenuOption
            (
                this.options.length + 1, 
                ") ",
                "BACK",
                function()
                {
                    console.log("back button");
                    return true;
                }
            )
        );
    }
}