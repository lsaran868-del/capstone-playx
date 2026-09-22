# Build stage using Maven and Eclipse Temurin JDK 17
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and pre-fetch dependencies for layer caching
COPY pom.xml .

# Copy source code
COPY src ./src

# Package application JAR without running tests
RUN mvn package -DskipTests

# Lightweight production runtime stage using Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy generated executable JAR from build stage as /app/app.jar
COPY --from=build /app/target/*.jar /app/app.jar

# Environment variables for production paths and profiles
ENV SPRING_PROFILES_ACTIVE=production \
    MUSIC_STORAGE_PATH=/app/uploads/music \
    MUSIC_COVERS_PATH=/app/uploads/covers

# Create uploads directory structure for persistent volume mount
RUN mkdir -p /app/uploads/music /app/uploads/covers

# Persistent storage volume mount point (/app/uploads)
VOLUME ["/app/uploads"]

# Expose default port (Render sets $PORT dynamically; Spring Boot defaults to 8080)
EXPOSE 8080

# Start Spring Boot application using /app/app.jar
CMD ["java", "-jar", "app.jar"]
