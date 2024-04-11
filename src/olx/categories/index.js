"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = exports.Category = void 0;
var playwright_1 = require("playwright");
var user_agents_1 = require("user-agents");
var log = console;
var EXCLUDED_RESOURCES = [
    // "document",
    "stylesheet",
    "image",
    "media",
    "font",
    // "script",
    "texttrack", // https://developer.mozilla.org/en-US/docs/Web/API/TextTrack
    // "xhr",
    // "fetch",
    "eventsource",
    "websocket",
    "manifest",
    "other",
];
var OPTIONS = {};
var Browsers = /** @class */ (function () {
    function Browsers() {
        this.webEngines = ["chromium", "firefox"];
        this.browsers = [];
        this.isInitialized = false;
    }
    Browsers.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, webEngine, browser;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.webEngines;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        webEngine = _a[_i];
                        return [4 /*yield*/, playwright_1.default[webEngine].launch(OPTIONS)];
                    case 2:
                        browser = _b.sent();
                        this.browsers.push(browser);
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.isInitialized = true;
                        return [2 /*return*/];
                }
            });
        });
    };
    Browsers.prototype.getRandom = function () {
        var randomIndex = Math.floor(Math.random() * this.browsers.length);
        var browser = this.browsers[randomIndex];
        if (browser !== undefined) {
            return browser;
        }
        throw new Error("No browser available");
    };
    Browsers.prototype.kill = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, browser;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.browsers;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        browser = _a[_i];
                        return [4 /*yield*/, browser.close()];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Browsers;
}());
var browsers = new Browsers();
var PageFactory = /** @class */ (function () {
    function PageFactory() {
    }
    PageFactory.prototype.get = function () {
        return __awaiter(this, void 0, void 0, function () {
            var browser, userAgent, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!!browsers.isInitialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, browsers.init()];
                    case 1:
                        _c.sent();
                        _c.label = 2;
                    case 2:
                        browser = browsers.getRandom();
                        userAgent = new user_agents_1.default({ deviceCategory: "desktop" }).toString();
                        _a = this;
                        return [4 /*yield*/, browser.newContext({ userAgent: userAgent })];
                    case 3:
                        _a.context = _c.sent();
                        _b = this;
                        return [4 /*yield*/, this.context.newPage()];
                    case 4:
                        _b.page = _c.sent();
                        return [2 /*return*/, this.page];
                }
            });
        });
    };
    PageFactory.prototype.kill = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.context) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.context.close()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return PageFactory;
}());
var Category = /** @class */ (function () {
    function Category(name, url) {
        this.name = name;
        this.url = url;
        this.sub = [];
        this.subLoaded = false;
    }
    Category.prototype.getName = function () {
        return this.name;
    };
    Category.prototype.getUrl = function () {
        return this.url;
    };
    Category.prototype.getSubs = function () {
        return this.sub[Symbol.iterator];
    };
    Category.prototype.setSubs = function (sub) {
        var _a;
        if (sub.length !== 0) {
            (_a = this.sub).push.apply(_a, sub);
            this.subLoaded = true;
        }
    };
    Category.prototype.findSub = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, category_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.subLoaded) return [3 /*break*/, 2];
                        return [4 /*yield*/, handleScraper(category, {
                                url: this.getUrl(),
                                data: { superCategory: this },
                            })];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2:
                        for (_i = 0, _a = this.sub; _i < _a.length; _i++) {
                            category_1 = _a[_i];
                            if (category_1.getName().toUpperCase() === name.toUpperCase()) {
                                return [2 /*return*/, category_1];
                            }
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    return Category;
}());
exports.Category = Category;
function sitemap(page, rootUrl) {
    return __awaiter(this, void 0, void 0, function () {
        function getSubCategories(categoryElement) {
            return __awaiter(this, void 0, void 0, function () {
                function findSubForSubElement(element) {
                    return __awaiter(this, void 0, void 0, function () {
                        var link, linkHref, linkText, subCategory, _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    link = element.locator("> div > a").first();
                                    return [4 /*yield*/, link.evaluate(function (e) { return e.href; })];
                                case 1:
                                    linkHref = _c.sent();
                                    return [4 /*yield*/, link.textContent()];
                                case 2:
                                    linkText = _c.sent();
                                    if (!(linkHref && linkText)) return [3 /*break*/, 4];
                                    subCategory = new Category(linkText, linkHref);
                                    _b = (_a = subCategory).setSubs;
                                    return [4 /*yield*/, getSubCategories(element)];
                                case 3:
                                    _b.apply(_a, [_c.sent()]);
                                    subCategories_1.push(subCategory);
                                    _c.label = 4;
                                case 4: return [2 /*return*/];
                            }
                        });
                    });
                }
                var subCategoryElements, subCategories_1, queue_1, _i, subCategoryElements_1, subCategoryElement;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, categoryElement
                                .locator("> ul > li")
                                .all()];
                        case 1:
                            subCategoryElements = _a.sent();
                            if (!(subCategoryElements.length !== 0)) return [3 /*break*/, 3];
                            subCategories_1 = [];
                            queue_1 = [];
                            for (_i = 0, subCategoryElements_1 = subCategoryElements; _i < subCategoryElements_1.length; _i++) {
                                subCategoryElement = subCategoryElements_1[_i];
                                queue_1.push(findSubForSubElement(subCategoryElement));
                            }
                            return [4 /*yield*/, Promise.all(queue_1)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, subCategories_1];
                        case 3: return [2 /*return*/, []];
                    }
                });
            });
        }
        function findSubForElement(element) {
            return __awaiter(this, void 0, void 0, function () {
                var link, category, _a, _b, _c, _d;
                var _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            link = element.locator("a").first();
                            _a = Category.bind;
                            return [4 /*yield*/, link.textContent()];
                        case 1:
                            _b = [void 0, (_e = (_f.sent())) !== null && _e !== void 0 ? _e : ""];
                            return [4 /*yield*/, link.evaluate(function (e) { return e.href; })];
                        case 2:
                            category = new (_a.apply(Category, _b.concat([(_f.sent()) || ""])))();
                            _d = (_c = category).setSubs;
                            return [4 /*yield*/, getSubCategories(element)];
                        case 3:
                            _d.apply(_c, [_f.sent()]);
                            categories.setSubs([category]);
                            return [2 /*return*/];
                    }
                });
            });
        }
        var categories, url, title, content, topCategoryElements, queue, _i, topCategoryElements_1, topCategoryElement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    categories = new Category("root", rootUrl);
                    url = rootUrl + "sitemap/";
                    return [4 /*yield*/, page.route("**/*", function (route) {
                            return EXCLUDED_RESOURCES.includes(route.request().resourceType())
                                ? route.abort()
                                : route.continue();
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.goto(url)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.title()];
                case 3:
                    title = _a.sent();
                    log.info("[SITEMAP] ".concat(title, ": ").concat(url));
                    return [4 /*yield*/, page.waitForSelector("#hydrate-root", { timeout: 10000 })];
                case 4:
                    _a.sent();
                    content = page.locator("#mainContent");
                    return [4 /*yield*/, content
                            .locator("div:has(> h1) > div")
                            .all()];
                case 5:
                    topCategoryElements = _a.sent();
                    queue = [];
                    for (_i = 0, topCategoryElements_1 = topCategoryElements; _i < topCategoryElements_1.length; _i++) {
                        topCategoryElement = topCategoryElements_1[_i];
                        queue.push(findSubForElement(topCategoryElement));
                    }
                    return [4 /*yield*/, Promise.all(queue)];
                case 6:
                    _a.sent();
                    return [2 /*return*/, categories];
            }
        });
    });
}
function category(page, url, data) {
    return __awaiter(this, void 0, void 0, function () {
        var title, categories, content, categoryElements, _i, categoryElements_1, categoryElement, link, linkText, linkHref, category_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.route("**/*", function (route) {
                        return EXCLUDED_RESOURCES.includes(route.request().resourceType())
                            ? route.abort()
                            : route.continue();
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.goto(url)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.title()];
                case 3:
                    title = _a.sent();
                    log.info("[CATEGORY] ".concat(title, ": ").concat(url));
                    return [4 /*yield*/, page.waitForSelector("#hydrate-root", { timeout: 10000 })];
                case 4:
                    _a.sent();
                    categories = [];
                    content = page.locator("#mainContent");
                    return [4 /*yield*/, content
                            .getByTestId("listing-filters-form")
                            .getByTestId("listing-filters")
                            .getByTestId("category-count-links")
                            .locator("li")
                            .all()];
                case 5:
                    categoryElements = _a.sent();
                    _i = 0, categoryElements_1 = categoryElements;
                    _a.label = 6;
                case 6:
                    if (!(_i < categoryElements_1.length)) return [3 /*break*/, 10];
                    categoryElement = categoryElements_1[_i];
                    link = categoryElement.locator("a").first();
                    return [4 /*yield*/, link.evaluate(function (e) { var _a; return (_a = e.childNodes[0]) === null || _a === void 0 ? void 0 : _a.textContent; })];
                case 7:
                    linkText = (_a.sent()) || "";
                    return [4 /*yield*/, link.evaluate(function (e) { return e.href; })];
                case 8:
                    linkHref = (_a.sent()) || "";
                    category_2 = new Category(linkText, linkHref);
                    categories.push(category_2);
                    _a.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 6];
                case 10:
                    data.superCategory.setSubs(categories);
                    return [2 /*return*/];
            }
        });
    });
}
function handleScraper(func_1, args_1) {
    return __awaiter(this, arguments, void 0, function (func, args, retries) {
        var result, retry, pageFactory, page, error_1;
        if (retries === void 0) { retries = 3; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = null;
                    retry = 0;
                    _a.label = 1;
                case 1:
                    if (!(retry < retries)) return [3 /*break*/, 8];
                    pageFactory = new PageFactory();
                    return [4 /*yield*/, pageFactory.get()];
                case 2:
                    page = _a.sent();
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, 6, 7]);
                    return [4 /*yield*/, func(page, args.url, args.data)];
                case 4:
                    result = _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    log.error(error_1);
                    retry++;
                    result = null;
                    return [3 /*break*/, 7];
                case 6:
                    pageFactory.kill();
                    return [7 /*endfinally*/];
                case 7: return [3 /*break*/, 1];
                case 8: return [2 /*return*/, result];
            }
        });
    });
}
function getCategories(country, options) {
    return __awaiter(this, void 0, void 0, function () {
        var mainUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (options) {
                        OPTIONS = options;
                    }
                    mainUrl = "https://www.olx.".concat(country, "/");
                    return [4 /*yield*/, handleScraper(sitemap, { url: mainUrl })];
                case 1: return [2 /*return*/, (_a.sent())];
            }
        });
    });
}
exports.getCategories = getCategories;
