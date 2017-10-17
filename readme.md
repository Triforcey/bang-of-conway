# Bang of Conway
### What is it?
The purpose of this experiment was to put Conway's Game of Life against survival of the fittest. This program will take input from the user and use it to generate a random population of creatures. Each one of these creatures is made up of a Game of Life pattern. All creatures will move forward to the next frame at the same time. Imbetween each one of those periods every creature will be pinned against every other creature. If it decides to attack the bigger one will win. If they're the same size initiative wins. After this happens and all the creatures have moved to the next frame, all the remaining creatures will split. The new one will take on the initial pattern of it's parent with some chance for mutation. The process continues from here.
### That didn't make any sense. How do I use it?
~~~~bash
git clone https://github.com/Triforcey/bang-of-conway.git
cd bang-of-conway
npm install
npm start
~~~~
If you don't have root privledges, or do not want to run on port 80:
~~~~bash
export PORT={port}
~~~~
