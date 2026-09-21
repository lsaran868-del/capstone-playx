# Build stage using Maven and Eclipse Temurin JDK 17
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml and pre-fetch dependencies for layer caching
COPY pom.xml .
RUN mvn dependency:resolve -B

# Copy source code
COPY src ./src

# Package application JAR without running tests
RUN mvn clean package -DskipTests

# Lightweight production runtime stage using Eclipse Temurin JRE 17
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy generated executable JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose default Render port
EXPOSE 8080


# Start Spring Boot application
CMD ["java", "-jar", "app.jar"]
