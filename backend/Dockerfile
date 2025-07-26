FROM ghcr.io/astral-sh/uv:debian

WORKDIR /app

COPY pyproject.toml ./
COPY .python-version ./

RUN uv sync

COPY . . 

EXPOSE 3674

CMD ["uv", "run", "app.py"]