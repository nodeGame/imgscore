TESTDIR <- '/home/stefano/www/ngtest/games/imgscore/scripts/'

data <- read.table(paste0(TESTDIR, 'sets_test.csv'), sep=",", head=TRUE)

data <- read.table(paste0(TESTDIR, 'sets-of-images-final.csv'), sep=",", head=TRUE)
a <- table(data$items)
hist(a)

head(table(data$path))

plot(table(data$items))


data$setpath <- paste0(data$set, data$items)
d <- duplicated(data$items)
nrow(data[d,])
data[d,]

