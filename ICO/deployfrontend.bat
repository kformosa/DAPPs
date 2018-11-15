robocopy src\ docs\ /MIR
robocopy build\contracts\ docs\
git add .
git commit -m "Compiles assets for Github Pages"
git push -u origin pages