// ==UserScript==
// @name        Auto Hatchery - pokeclicker.com
// @namespace   Violentmonkey Scripts
// @match       https://www.pokeclicker.com/
// @grant       none
// @version     1.1
// @author      Ivan Lay
// @description Automatically hatches eggs at 100% completion. Then uses the sorting and filters from the Hatcher to fill it with the best remaining Pokémon.
// ==/UserScript==

function loopEggs() {
  var eggLoop = setInterval(function () {
    // Attempt to hatch each egg. If the egg is at 100% it will succeed
    [0, 1, 2, 3].forEach((index) => App.game.breeding.hatchPokemonEgg(index));

    // Now add eggs to empty slots if we can
    while (
      App.game.breeding.canAccess() == true && // Can access the Hatchery
      App.game.party.hasMaxLevelPokemon() && // Don't run if you don't have any level 100 Pokemon
      App.game.breeding.hasFreeEggSlot() // Has an open egg slot
    ) {
      // Filter the sorted list of Pokemon based on the parameters set in the Hatchery screen
      let filteredEggList = App.game.party.caughtPokemon.filter(
        (partyPokemon) => {
          // Only breedable Pokemon
          if (partyPokemon.breeding || partyPokemon.level < 100) {
            return false;
          }
          // Check based on category
          if (BreedingController.filter.category() >= 0) {
            if (
              partyPokemon.category !== BreedingController.filter.category()
            ) {
              return false;
            }
          }
          // Check based on shiny status
          if (BreedingController.filter.shinyStatus() >= 0) {
            if (
              +partyPokemon.shiny !== BreedingController.filter.shinyStatus()
            ) {
              return false;
            }
          }
          // Check based on native region
          if (BreedingController.filter.region() > -2) {
            if (
              PokemonHelper.calcNativeRegion(partyPokemon.name) !==
              BreedingController.filter.region()
            ) {
              return false;
            }
          }
          // Check if either of the types match
          const type1 =
            BreedingController.filter.type1() > -2
              ? BreedingController.filter.type1()
              : null;
          const type2 =
            BreedingController.filter.type2() > -2
              ? BreedingController.filter.type2()
              : null;
          if (type1 !== null || type2 !== null) {
            const { type: types } = pokemonMap[partyPokemon.name];
            if ([type1, type2].includes(PokemonType.None)) {
              const type = type1 == PokemonType.None ? type2 : type1;
              if (!BreedingController.isPureType(partyPokemon, type)) {
                return false;
              }
            } else if (
              (type1 !== null && !types.includes(type1)) ||
              (type2 !== null && !types.includes(type2))
            ) {
              return false;
            }
          }
          return true;
        }
      );

      App.game.breeding.addPokemonToHatchery(filteredEggList[0]);
      //console.log("Added " + filteredEggList[0].name + " to the Hatchery!");
    }
  }, 50); // Runs every game tick
}

loopEggs();