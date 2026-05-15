const { MongoClient } = require('mongodb');

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'science_journal';

async function main() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');
        const db = client.db(dbName);
        const collection = db.collection('articles');

        await collection.deleteMany({});
        console.log('🗑️ Old articles removed');

        const articles = [
            {
                title: "Современные подходы к оптимизации кода на Python",
                authors: ["Улискин Даниил", "Толкачёв Иван"],
                publicationDate: new Date("2025-03-15"),
                content: "В статье рассматриваются методы оптимизации Python-кода: профилирование, использование Cython, Numba и векторизация с NumPy.",
                tags: ["Python", "оптимизация", "производительность"],
                reviews: [
                    { name: "Алексей", text: "Очень полезная статья!", rating: 10 },
                    { name: "Мария", text: "Хорошие примеры", rating: 8 }
                ]
            },
            {
                title: "Архитектура микросервисов на Node.js в 2026 году",
                authors: ["Чистюхин Антон", "Куракова Александра"],
                publicationDate: new Date("2025-06-20"),
                content: "Обзор современных подходов к построению микросервисных систем на Node.js с использованием RabbitMQ, Kubernetes и gRPC.",
                tags: ["Node.js", "микросервисы", "backend"],
                reviews: [
                    { name: "Игорь", text: "Актуально и понятно", rating: 9 },
                    { name: "Ольга", text: "Отличный обзор технологий", rating: 9 }
                ]
            },
            {
                title: "Искусственный интеллект в тестировании ПО: методы и практики",
                authors: ["Лякин Евгений", "Шпагин Сергей"],
                publicationDate: new Date("2025-11-10"),
                content: "Применение машинного обучения для автоматизации тестирования, генерации тестовых данных и предсказания дефектов.",
                tags: ["AI", "тестирование", "ML"],
                reviews: [
                    { name: "Дмитрий", text: "Инновационный подход", rating: 9 },
                    { name: "Елена", text: "Жду продолжения", rating: 8 }
                ]
            },
            {
                title: "Безопасность веб-приложений: современные угрозы и защита",
                authors: ["Улискин Даниил", "Чистюхин Антон", "Куракова Александра"],
                publicationDate: new Date("2025-09-05"),
                content: "Анализ актуальных уязвимостей веб-приложений в 2025 году: CSRF, XSS, SQL-инъекции, а также методы защиты.",
                tags: ["security", "web", "cybersecurity"],
                reviews: [
                    { name: "Павел", text: "Очень подробно и полезно", rating: 10 },
                    { name: "Анна", text: "Хороший чек-лист", rating: 8 }
                ]
            },
            {
                title: "Квантовые вычисления и их применение в криптографии",
                authors: ["Шпагин Сергей", "Толкачёв Иван"],
                publicationDate: new Date("2026-01-20"),
                content: "Введение в квантовые алгоритмы и их влияние на современную криптографию. Постквантовые алгоритмы шифрования.",
                tags: ["quantum", "cryptography", "future"],
                reviews: [
                    { name: "Максим", text: "Сложно, но интересно", rating: 8 },
                    { name: "Юлия", text: "Хорошая база", rating: 7 }
                ]
            },
            {
                title: "Разработка кроссплатформенных мобильных приложений на Flutter",
                authors: ["Куракова Александра", "Лякин Евгений"],
                publicationDate: new Date("2025-05-18"),
                content: "Сравнение Flutter с React Native, архитектура Bloc, оптимизация производительности.",
                tags: ["Flutter", "mobile", "Dart"],
                reviews: [
                    { name: "Андрей", text: "Советую всем разработчикам", rating: 9 },
                    { name: "Татьяна", text: "Отличные примеры кода", rating: 9 }
                ]
            },
            {
                title: "DevOps практики для малых команд разработки",
                authors: ["Толкачёв Иван", "Чистюхин Антон"],
                publicationDate: new Date("2025-12-01"),
                content: "Как внедрить CI/CD, Docker и мониторинг в небольших проектах без лишних затрат.",
                tags: ["DevOps", "CI/CD", "Docker"],
                reviews: [
                    { name: "Сергей", text: "Практичное руководство", rating: 10 }
                ]
            },
            {
                title: "Новые возможности TypeScript 6.0 в 2026 году",
                authors: ["Улискин Даниил"],
                publicationDate: new Date("2026-02-10"),
                content: "Обзор новых фич TypeScript: улучшенная типизация, декораторы, утилитарные типы.",
                tags: ["TypeScript", "frontend", "JavaScript"],
                reviews: [
                    { name: "Антон", text: "Ждал эту статью", rating: 10 },
                    { name: "Евгений", text: "Полезно", rating: 9 }
                ]
            }
        ];

        const result = await collection.insertMany(articles);
        console.log(`✅ ${result.insertedCount} статей добавлено в базу данных`);
        
        // Выводим список всех авторов для проверки
        const allAuthors = await collection.distinct("authors");
        console.log("\n📋 Список всех авторов в базе:");
        allAuthors.forEach(author => console.log(`   - ${author}`));
        
    } catch (err) {
        console.error('❌ Ошибка:', err);
    } finally {
        await client.close();
        console.log('🔌 Connection closed');
    }
}

main();