import React from "react";

const Pagination = ({ totalPages,paginate,currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <>
      <nav>
        <ul className="pagination pagination-sm overflow-auto">
          <li className={`page-item ${currentPage == 1 ? "disabled" : ""}`}>
            <a 
            className={`page-link`} 
            href="#"
            onClick={paginate(parseInt(currentPage)-1)}
            >
              <span aria-hidden="true">&laquo;</span>
              <span className="sr-only">Previous</span>
            </a>
          </li>

          {/* {pageNumbers.map((number) => (              
            <li className={`page-item ${currentPage == number ? "active" : ""} `} key={number}>
              <a
                href="#"
                className="page-link"
                onClick={paginate(number)}
              >
                {number}
              </a>
            </li>
          ))} */}

          {
            (currentPage >= 1 && currentPage <= totalPages) ? (
              <>               
                <li className={`page-item active`} key={currentPage}>
                  <a
                    href="#"
                    className="page-link"
                    onClick={paginate(currentPage)}
                  >
                    {currentPage}
                  </a>
                </li>                
              </>              
            ) : null
          }

          <li className={`page-item ${currentPage == totalPages ? "disabled" : ""}`}>
            <a className={`page-link`} href="#" onClick={paginate( parseInt(currentPage)+1)}>
              <span aria-hidden="true">&raquo;</span>
              <span className="sr-only">Next</span>
            </a>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default Pagination;
