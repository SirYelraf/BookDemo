package com.library_management.service;

import com.library_management.model.Book;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface BookService {

    List<Book> findAllBooks();

    Book findBookById(Long id);

    Book findBookByName(String name);

    List<Book> findBooksByAuthor(String author);

    List<Book> FindAllBooksByAuthorAndBookName(String author, String bookName);

    Book createBook(Book book);

    Book updateBook(Book book);

    void deleteBookById(Long id);
}
