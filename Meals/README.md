# Meals System

## Setup
* Create a Google Sheet based on the example CSV sheets included that demonstrate the format of the spreadsheet
* Setup the field data validation that is used to create a dropdown list from the Food column on other sheets of the same meal name ie. Breakfast
* Create a Google Apps Script file for each source code file (including ArrayUtils.gs and StringUtils.gs from the Tennis Roster project - https://github.com/craigneasbey/GoogleScripts/tree/master/Tennis)

## Use
* enter food (Food,Ingredients,Instructions) on specific meal sheets (Breakfast, Dinner, etc)
* allocate which meals are for this week on the Plan sheet
* generate the shopping list sheet
* hide items that have already been purchased
* sort items to align with the super market isles

## Shopping List Menu
The Shopping List menu allows the user to:
* Generate Shopping List - creates a Shopping List sheet with items grouped and sorted alphabetically
