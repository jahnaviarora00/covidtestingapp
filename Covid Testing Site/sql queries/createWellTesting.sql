use CovidTesting;
CREATE TABLE WellTesting(
poolBarcode VARCHAR(50),
wellBarcode VARCHAR(50),
testingStartTime datetime,
testingEndTime DATETIME,
result VARCHAR(20), 
CHECK (result IN ("in progress", "negative", "positive"))
);