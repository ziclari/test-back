sudo docker build -t simulador-app  .  

sudo docker run -d --name simuladores --network general-network simulador-app:latest

docker stop simuladores
docker start simuladores
sudo docker rmi simulador-app:latest  

http://localhost:8080

http://localhost:8080/corp-espionage
http://localhost:8080/electroconexiones
http://localhost:8080/haunted-mansion
http://localhost:8080/neon-detective

npx serve -s dist -l 4173