data <- read.table('./sets_test.csv', sep=",", head=TRUE)

hist(table(data$path))

head(table(data$path))

plot(table(data$path))


data$setpath <- paste0(data$set, data$path)
d <- duplicated(data$setpath)
nrow(data[d,])
data[d,]
