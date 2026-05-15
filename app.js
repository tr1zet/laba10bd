const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override');
const path = require('path');

const app = express();
const PORT = 3000;
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'science_journal';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));

let db, articlesCollection;

async function connectDB() {
    const client = new MongoClient(url);
    await client.connect();
    db = client.db(dbName);
    articlesCollection = db.collection('articles');
    console.log('✅ База данных подключена');
}

async function getAllAuthors() {
    const authors = await articlesCollection.distinct('authors');
    return authors.sort();
}

function formatArticles(articles) {
    return articles.map((article, idx) => ({
        id: idx + 1,
        _id: article._id,
        title: article.title,
        authors: article.authors.join(', '),
        publicationDate: article.publicationDate ? article.publicationDate.toISOString().split('T')[0] : 'Дата не указана',
        avgRating: article.reviews && article.reviews.length > 0 
            ? (article.reviews.reduce((sum, r) => sum + r.rating, 0) / article.reviews.length).toFixed(1)
            : 'Нет оценок'
    }));
}

// ==================== ГЛАВНАЯ СТРАНИЦА ====================
app.get('/', async (req, res) => {
    try {
        const authors = await getAllAuthors();
        res.render('index', { 
            articles: [], 
            authors, 
            searchTitle: '', 
            selectedAuthor: '',
            startDate: '',
            endDate: '',
            message: 'Нажмите "Список статей" для просмотра'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// ==================== СПИСОК ВСЕХ СТАТЕЙ ====================
app.post('/articles', async (req, res) => {
    try {
        const allArticles = await articlesCollection.find({}).toArray();
        const formatted = formatArticles(allArticles);
        const authors = await getAllAuthors();
        res.render('index', { 
            articles: formatted, 
            authors, 
            searchTitle: '', 
            selectedAuthor: '',
            startDate: '',
            endDate: '',
            message: `📚 Всего статей: ${formatted.length}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// ==================== ПОИСК ПО НАЗВАНИЮ ====================
app.post('/search-title', async (req, res) => {
    const searchText = req.body.searchTitle || '';
    try {
        let query = {};
        if (searchText.trim() !== '') {
            query = { title: { $regex: searchText, $options: 'i' } };
        }
        const foundArticles = await articlesCollection.find(query).toArray();
        const formatted = formatArticles(foundArticles);
        const authors = await getAllAuthors();
        res.render('index', { 
            articles: formatted, 
            authors, 
            searchTitle: searchText, 
            selectedAuthor: '',
            startDate: '',
            endDate: '',
            message: formatted.length > 0 ? `🔍 Найдено по названию "${searchText}": ${formatted.length}` : `❌ По запросу "${searchText}" ничего не найдено`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// ==================== ПОИСК ПО АВТОРУ ====================
app.post('/search-author', async (req, res) => {
    const selectedAuthor = req.body.authorName || '';
    try {
        let query = {};
        if (selectedAuthor.trim() !== '') {
            query = { authors: selectedAuthor };
        }
        const foundArticles = await articlesCollection.find(query).toArray();
        const formatted = formatArticles(foundArticles);
        const authors = await getAllAuthors();
        res.render('index', { 
            articles: formatted, 
            authors, 
            searchTitle: '', 
            selectedAuthor,
            startDate: '',
            endDate: '',
            message: formatted.length > 0 ? `👨‍💻 Статей автора "${selectedAuthor}": ${formatted.length}` : `❌ У автора "${selectedAuthor}" нет статей`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// ==================== ПОИСК ПО ДАТЕ ====================
app.post('/search-date', async (req, res) => {
    let { startDate, endDate } = req.body;
    try {
        let query = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query = { publicationDate: { $gte: start, $lte: end } };
        } else if (startDate) {
            const start = new Date(startDate);
            query = { publicationDate: { $gte: start } };
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query = { publicationDate: { $lte: end } };
        }
        const foundArticles = await articlesCollection.find(query).toArray();
        const formatted = formatArticles(foundArticles);
        const authors = await getAllAuthors();
        res.render('index', { 
            articles: formatted, 
            authors, 
            searchTitle: '', 
            selectedAuthor: '',
            startDate: startDate || '',
            endDate: endDate || '',
            message: formatted.length > 0 ? `📅 Найдено статей за период: ${formatted.length}` : `❌ За выбранный период статей не найдено`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// ==================== ТОП СТАТЕЙ (ПО РЕЙТИНГУ И КОММЕНТАРИЯМ) ====================
app.get('/top-articles', async (req, res) => {
    try {
        const allArticles = await articlesCollection.find({}).toArray();
        
        // Рассчитываем рейтинг и количество комментариев
        const articlesWithStats = allArticles.map(article => {
            const reviews = article.reviews || [];
            const avgRating = reviews.length > 0 
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                : 0;
            return {
                ...article,
                avgRating: avgRating,
                commentsCount: reviews.length
            };
        });
        
        // Сортируем: сначала по рейтингу (по убыванию), затем по количеству комментариев
        articlesWithStats.sort((a, b) => {
            if (b.avgRating !== a.avgRating) {
                return b.avgRating - a.avgRating;
            }
            return b.commentsCount - a.commentsCount;
        });
        
        const formatted = articlesWithStats.map((article, idx) => ({
            id: idx + 1,
            _id: article._id,
            title: article.title,
            authors: article.authors.join(', '),
            publicationDate: article.publicationDate ? article.publicationDate.toISOString().split('T')[0] : 'Дата не указана',
            rating: article.avgRating.toFixed(1),
            commentsCount: article.commentsCount
        }));
        
        const authors = await getAllAuthors();
        res.render('index', { 
            articles: formatted, 
            authors, 
            searchTitle: '', 
            selectedAuthor: '',
            startDate: '',
            endDate: '',
            message: `🏆 ТОП статей по рейтингу (при равенстве — по количеству комментариев)`
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// ==================== СТРАНИЦА СТАТЬИ (ПОЛНАЯ ИНФОРМАЦИЯ) ====================
app.get('/article/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const article = await articlesCollection.findOne({ _id: new ObjectId(articleId) });
        
        if (!article) {
            return res.status(404).send('Статья не найдена');
        }
        
        // Форматируем дату
        const formattedDate = article.publicationDate 
            ? article.publicationDate.toISOString().split('T')[0] 
            : 'Дата не указана';
        
        // Вычисляем средний рейтинг
        const reviews = article.reviews || [];
        const avgRating = reviews.length > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : 'Нет оценок';
        
        res.render('article', {
            article,
            formattedDate,
            avgRating,
            reviewsCount: reviews.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка сервера');
    }
});

// ==================== УДАЛЕНИЕ СТАТЬИ ====================
app.delete('/article/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const result = await articlesCollection.deleteOne({ _id: new ObjectId(articleId) });
        
        if (result.deletedCount === 1) {
            console.log(`✅ Статья ${articleId} удалена`);
        }
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при удалении статьи');
    }
});

// ==================== ФОРМА СОЗДАНИЯ СТАТЬИ ====================
app.get('/create-article', (req, res) => {
    res.render('create');
});

// ==================== СОЗДАНИЕ НОВОЙ СТАТЬИ ====================
app.post('/article', async (req, res) => {
    try {
        const { title, authors, publicationDate, content, tags } = req.body;
        
        // Преобразуем строку авторов в массив
        const authorsArray = authors.split(',').map(a => a.trim());
        
        // Преобразуем теги в массив
        const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];
        
        const newArticle = {
            title: title,
            authors: authorsArray,
            publicationDate: new Date(publicationDate),
            content: content,
            tags: tagsArray,
            reviews: []
        };
        
        const result = await articlesCollection.insertOne(newArticle);
        console.log(`✅ Создана новая статья: ${title}`);
        res.redirect(`/article/${result.insertedId}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при создании статьи');
    }
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
    });
});