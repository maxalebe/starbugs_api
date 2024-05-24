# Run the API

## Start containers

Log in to GHCR via terminal:

```
docker login ghcr.io
```

Build the image:

```
docker build -t ghcr.io/<your-username>/constellarium_api:latest .
```

Push the image to GHCR:
```
docker push ghcr.io/<your-username>/constellarium_api:latest
```

Create stack (or use portainer)

```
docker-compose up --build
```

Import data into MongoDB:

- Grab https://github.com/astronexus/ATHYG-Database/blob/main/data/subsets/athyg_31_reduced_m10.csv.gz and unzip it
- Import this data to mongoDB (using mongoDB Compass e. g.)
